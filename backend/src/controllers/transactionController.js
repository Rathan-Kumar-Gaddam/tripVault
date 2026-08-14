import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Trip from '../models/Trip.js';

//// @desc    Admin logs a transaction (Common or Individual)
// @route   POST /api/transactions
export const logTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tripId, type, amount, description, sharedBy } = req.body;
    const adminId = req.user._id;

    if (!sharedBy || sharedBy.length === 0) {
      throw new Error('Must specify at least one user to share the transaction.');
    }

    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new Error('Trip not found');

    const isAdmin = trip.members.some(
      (m) => m.user.toString() === adminId.toString() && m.role === 'admin'
    );
    if (!isAdmin) throw new Error('Only admins can log money.');

    // 1. Create Ledger Entry
    const transaction = await Transaction.create(
      [{ tripId, type, amount, description, sharedBy, createdBy: adminId }],
      { session }
    );

    // 2. Math for Individual Splits
    const splitAmount = amount / sharedBy.length;

    // 3. Update the Global Vault Total (ONCE, outside the loop)
    // We ensure it starts at 0 if it was undefined
    trip.totalVault = trip.totalVault || 0; 
    
    if (type === 'contribution') {
      trip.totalVault += amount; // Money comes INTO the pool
    } else if (type === 'expense') {
      trip.totalVault -= amount; // Money goes OUT of the pool
    }

    // 4. Update Individual Member Balances
    sharedBy.forEach((userId) => {
      const member = trip.members.find((m) => m.user.toString() === userId.toString());
      if (member) {
        if (type === 'contribution') {
          member.balance += splitAmount; 
        } else if (type === 'expense') {
          member.balance -= splitAmount; 
        }
      }
    });

    await trip.save({ session });
    await session.commitTransaction();

    res.status(201).json({ message: 'Transaction logged successfully', transaction: transaction[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get all transactions for a trip
// @route   GET /api/transactions/:tripId
export const getTransactions = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify user is in the trip
    const trip = await Trip.findById(tripId);
    const isMember = trip.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const transactions = await Transaction.find({ tripId })
      .populate('sharedBy', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 }); // Newest first

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};