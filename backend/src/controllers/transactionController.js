import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Trip from '../models/Trip.js';

/**
 * Recalculate and synchronize all member balances and total spend for a trip
 */
export const syncTripBalances = async (tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;

  // Optimized lean query selecting only balance calculation fields to save memory
  const transactions = await Transaction.find({ tripId })
    .select('type amount splits sharedBy payer createdBy')
    .lean();

  // Initialize balance for all members
  const memberBalances = {};
  trip.members.forEach((m) => {
    const uid = (m.user?._id || m.user)?.toString();
    if (uid) memberBalances[uid] = 0;
  });

  let totalTripExpenses = 0;

  transactions.forEach((tx) => {
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    if (!payerId) return;

    const isExpense = tx.type === 'expense';
    const isSettlement = tx.type === 'settlement';
    const isContribution = tx.type === 'contribution';

    if (isExpense) {
      totalTripExpenses += tx.amount || 0;
    }

    // Process splits
    const splits = (tx.splits && tx.splits.length > 0)
      ? tx.splits
      : (tx.sharedBy || []).map((uId) => ({
          user: uId,
          amount: (tx.amount || 0) / (tx.sharedBy.length || 1),
        }));

    splits.forEach((split) => {
      const debtorId = (split.user?._id || split.user)?.toString();
      if (!debtorId) return;

      const splitAmount = Number(split.amount) || 0;

      if (debtorId !== payerId) {
        // Payer is owed this amount (positive balance)
        if (memberBalances[payerId] !== undefined) {
          memberBalances[payerId] += splitAmount;
        }
        // Debtor owes this amount (negative balance)
        if (memberBalances[debtorId] !== undefined) {
          memberBalances[debtorId] -= splitAmount;
        }
      }
    });
  });

  // Assign calculated balances back to trip members
  trip.members.forEach((m) => {
    const uId = (m.user?._id || m.user)?.toString();
    if (uId) {
      m.balance = Math.round((memberBalances[uId] || 0) * 100) / 100;
    }
  });

  trip.totalVault = Math.round(totalTripExpenses * 100) / 100;
  await trip.save();

  return trip;
};

// @desc    Any trip member logs an expense, settlement, or contribution
// @route   POST /api/transactions
export const logTransaction = async (req, res) => {
  try {
    const { 
      tripId, 
      type = 'expense', 
      amount, 
      description, 
      category = 'General',
      payer, 
      splitType = 'all', 
      sharedBy = [], 
      splits = [],
      recipient 
    } = req.body;
    
    const userId = req.user._id;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount greater than 0 is required.' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Verify current user is a member of the trip
    const isMember = trip.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of this trip to log transactions.' });
    }

    // Determine Payer (defaults to logged-in user if not provided)
    const effectivePayer = payer || userId;
    const isPayerMember = trip.members.some((m) => m.user.toString() === effectivePayer.toString());
    if (!isPayerMember) {
      return res.status(400).json({ message: 'Payer must be a member of this trip.' });
    }

    // Construct splits based on type and splitType
    let finalSplits = [];
    let finalSharedBy = [];

    if (type === 'settlement') {
      // Settlement: Payer paid recipient directly
      const targetRecipient = recipient || (sharedBy.length > 0 ? sharedBy[0] : null) || (splits.length > 0 ? splits[0].user : null);
      if (!targetRecipient) {
        return res.status(400).json({ message: 'Recipient is required for settlement.' });
      }
      finalSplits = [{ user: targetRecipient, amount: numAmount }];
      finalSharedBy = [targetRecipient];
    } else if (splitType === 'all') {
      // Split equally among all trip members
      const splitAmount = Math.round((numAmount / trip.members.length) * 100) / 100;
      finalSplits = trip.members.map((m) => ({
        user: m.user,
        amount: splitAmount,
      }));
      finalSharedBy = trip.members.map((m) => m.user);
    } else if (splitType === 'individual') {
      // Specific single companion
      const targetUser = (sharedBy && sharedBy.length > 0) ? sharedBy[0] : (splits && splits.length > 0 ? splits[0].user : null);
      if (!targetUser) {
        return res.status(400).json({ message: 'Please select a companion for individual split.' });
      }
      finalSplits = [{ user: targetUser, amount: numAmount }];
      finalSharedBy = [targetUser];
    } else if (splitType === 'custom') {
      // Custom selection: Either pre-defined custom amounts or equal split among selected members
      if (splits && splits.length > 0 && splits.some((s) => s.amount !== undefined)) {
        // Custom amounts provided
        finalSplits = splits.map((s) => ({
          user: s.user,
          amount: Number(s.amount) || 0,
        }));
        finalSharedBy = splits.map((s) => s.user);
      } else if (sharedBy && sharedBy.length > 0) {
        // Equal split among selected members
        const splitAmount = Math.round((numAmount / sharedBy.length) * 100) / 100;
        finalSplits = sharedBy.map((uId) => ({
          user: uId,
          amount: splitAmount,
        }));
        finalSharedBy = sharedBy;
      } else {
        return res.status(400).json({ message: 'Please select at least one companion for custom split.' });
      }
    }

    // Create the Transaction record
    const transaction = await Transaction.create({
      tripId,
      type,
      amount: numAmount,
      description: description.trim(),
      category: category || 'General',
      payer: effectivePayer,
      splitType,
      splits: finalSplits,
      sharedBy: finalSharedBy,
      createdBy: userId,
    });

    // Synchronize trip member balances and total spend
    await syncTripBalances(tripId);

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('payer', 'name email phone avatar')
      .populate('createdBy', 'name email phone avatar')
      .populate('sharedBy', 'name email phone avatar')
      .populate('splits.user', 'name email phone avatar');

    res.status(201).json({ 
      message: 'Transaction logged successfully', 
      transaction: populatedTx 
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to log transaction' });
  }
};

// @desc    Get all transactions for a trip
// @route   GET /api/transactions/:tripId
export const getTransactions = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify user is in the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === req.user._id.toString();
    });
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    // Lean query returns plain JS objects, reducing memory allocation by ~70%
    const transactions = await Transaction.find({ tripId })
      .populate('payer', 'name email phone avatar')
      .populate('createdBy', 'name email phone avatar')
      .populate('sharedBy', 'name email phone avatar')
      .populate('splits.user', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const trip = await Trip.findById(transaction.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is trip admin or the creator of the transaction
    const isCreator = (transaction.createdBy?._id || transaction.createdBy)?.toString() === userId.toString();
    const isAdmin = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId === userId.toString() && m.role === 'admin';
    });

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this transaction.' });
    }

    await transaction.deleteOne();

    // Recalculate balances
    await syncTripBalances(trip._id);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};