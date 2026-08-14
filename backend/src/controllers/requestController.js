import FundRequest from '../models/FundRequest.js';
import Trip from '../models/Trip.js';
import Transaction from '../models/Transaction.js';
import { syncTripBalances } from './transactionController.js';

// @desc    Create a fund request to a companion
// @route   POST /api/requests
export const createRequest = async (req, res) => {
  try {
    const { tripId, targetUser, amount, description, category = 'Loan / Cash' } = req.body;
    const requesterId = req.user._id;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount greater than 0.' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Reason / description is required.' });
    }

    if (!targetUser) {
      return res.status(400).json({ message: 'Please select a companion to request funds from.' });
    }

    if (targetUser.toString() === requesterId.toString()) {
      return res.status(400).json({ message: 'You cannot request funds from yourself.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Verify both requester and targetUser are trip members
    const isRequesterMember = trip.members.some((m) => m.user.toString() === requesterId.toString());
    const isTargetMember = trip.members.some((m) => m.user.toString() === targetUser.toString());

    if (!isRequesterMember || !isTargetMember) {
      return res.status(403).json({ message: 'Both requester and companion must be members of this trip.' });
    }

    const fundRequest = await FundRequest.create({
      tripId,
      requester: requesterId,
      targetUser,
      amount: numAmount,
      description: description.trim(),
      category,
      status: 'pending',
    });

    const populated = await FundRequest.findById(fundRequest._id)
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar');

    res.status(201).json({ message: 'Fund request sent to companion! 📩', request: populated });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create fund request' });
  }
};

// @desc    Get all fund requests for a trip
// @route   GET /api/requests/trip/:tripId
export const getTripRequests = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isMember = trip.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const requests = await FundRequest.find({ tripId })
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to a fund request (Accept or Decline)
// @route   PUT /api/requests/:id/respond
export const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'decline'
    const userId = req.user._id;

    const fundRequest = await FundRequest.findById(id)
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar');

    if (!fundRequest) {
      return res.status(404).json({ message: 'Fund request not found.' });
    }

    // Only the target companion can accept or decline
    if (fundRequest.targetUser._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the requested companion can accept or decline this request.' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request has already been ${fundRequest.status}.` });
    }

    if (action === 'accept') {
      // 1. Automatically create transaction with giver as payer and requester as sole debtor
      const transaction = await Transaction.create({
        tripId: fundRequest.tripId,
        type: 'expense',
        amount: fundRequest.amount,
        description: `Covered for ${fundRequest.requester.name}: ${fundRequest.description}`,
        category: fundRequest.category || 'Loan / Cash',
        payer: fundRequest.targetUser._id, // Giver pays
        splitType: 'individual',
        splits: [{ user: fundRequest.requester._id, amount: fundRequest.amount }],
        sharedBy: [fundRequest.requester._id],
        createdBy: userId,
      });

      // 2. Synchronize trip balances
      await syncTripBalances(fundRequest.tripId);

      // 3. Mark request as accepted
      fundRequest.status = 'accepted';
      fundRequest.transactionId = transaction._id;
      fundRequest.respondedAt = new Date();
      await fundRequest.save();

      return res.json({ 
        message: `Fund request accepted! Transferred ${fundRequest.amount} to ${fundRequest.requester.name}.`,
        request: fundRequest,
        transaction,
      });
    } else if (action === 'decline') {
      fundRequest.status = 'declined';
      fundRequest.respondedAt = new Date();
      await fundRequest.save();

      return res.json({ 
        message: 'Fund request declined.',
        request: fundRequest,
      });
    } else {
      return res.status(400).json({ message: "Invalid action. Must be 'accept' or 'decline'." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to respond to request' });
  }
};

// @desc    Cancel a fund request (Requester only)
// @route   DELETE /api/requests/:id
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const fundRequest = await FundRequest.findById(id);
    if (!fundRequest) {
      return res.status(404).json({ message: 'Fund request not found.' });
    }

    if (fundRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the requester can cancel this request.' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a request that is already ${fundRequest.status}.` });
    }

    fundRequest.status = 'cancelled';
    await fundRequest.save();

    res.json({ message: 'Fund request cancelled.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
