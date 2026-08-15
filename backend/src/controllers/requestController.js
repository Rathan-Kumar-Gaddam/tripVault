import FundRequest from '../models/FundRequest.js';
import Trip from '../models/Trip.js';
import Transaction from '../models/Transaction.js';
import { syncTripBalances } from './transactionController.js';

// @desc    Create a fund request or a settlement payment request
// @route   POST /api/requests
export const createRequest = async (req, res) => {
  try {
    const { 
      tripId, 
      targetUser, 
      amount, 
      description, 
      category,
      requestType = 'fund_request' 
    } = req.body;
    const requesterId = req.user._id;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount greater than 0.' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Reason / description is required.' });
    }

    if (!targetUser) {
      return res.status(400).json({ message: 'Please select a companion for this request.' });
    }

    if (targetUser.toString() === requesterId.toString()) {
      return res.status(400).json({ message: 'You cannot create a request to yourself.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Verify both requester and targetUser are trip members
    const isRequesterMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === requesterId.toString();
    });
    const isTargetMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === targetUser.toString();
    });

    if (!isRequesterMember || !isTargetMember) {
      return res.status(403).json({ message: 'Both requester and companion must be members of this trip.' });
    }

    const fundRequest = await FundRequest.create({
      tripId,
      requestType,
      requester: requesterId,
      targetUser,
      amount: numAmount,
      description: description.trim(),
      category: category || (requestType === 'settlement' ? 'Settlement' : 'Loan / Cash'),
      status: 'pending',
    });

    const populated = await FundRequest.findById(fundRequest._id)
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar');

    const msg = requestType === 'settlement' 
      ? 'Settlement logged and sent to receiver for approval! 📩'
      : 'Fund request sent to companion! 📩';

    res.status(201).json({ message: msg, request: populated });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create request' });
  }
};

// @desc    Get all requests for a trip
// @route   GET /api/requests/trip/:tripId
export const getTripRequests = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === userId.toString();
    });
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const requests = await FundRequest.find({ tripId })
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to a request (Accept & Log Transaction OR Decline)
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
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Only the target companion (receiver) can accept or decline
    if (fundRequest.targetUser._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the recipient/companion can approve or decline this request.' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request has already been ${fundRequest.status}.` });
    }

    if (action === 'accept') {
      let transaction;

      if (fundRequest.requestType === 'settlement') {
        // Settlement: Requester (payer) sent money to TargetUser (receiver).
        // Receiver confirms receipt -> Creates official settlement transaction.
        transaction = await Transaction.create({
          tripId: fundRequest.tripId,
          type: 'settlement',
          amount: fundRequest.amount,
          description: fundRequest.description || `Settlement from ${fundRequest.requester.name} to ${fundRequest.targetUser.name}`,
          category: 'Settlement',
          payer: fundRequest.requester._id,
          recipient: fundRequest.targetUser._id,
          splitType: 'individual',
          splits: [{ user: fundRequest.targetUser._id, amount: fundRequest.amount }],
          sharedBy: [fundRequest.targetUser._id],
          createdBy: fundRequest.requester._id,
        });
      } else {
        // Fund Request: TargetUser covers an expense for Requester
        transaction = await Transaction.create({
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
      }

      // 2. Synchronize trip balances
      await syncTripBalances(fundRequest.tripId);

      // 3. Mark request as accepted
      fundRequest.status = 'accepted';
      fundRequest.transactionId = transaction._id;
      fundRequest.respondedAt = new Date();
      await fundRequest.save();

      const successMsg = fundRequest.requestType === 'settlement'
        ? `Settlement confirmed! Confirmed receipt of ${fundRequest.amount} from ${fundRequest.requester.name}. 🎉`
        : `Fund request accepted! Transferred ${fundRequest.amount} to ${fundRequest.requester.name}. 🎉`;

      return res.json({ 
        message: successMsg,
        request: fundRequest,
        transaction,
      });
    } else if (action === 'decline') {
      fundRequest.status = 'declined';
      fundRequest.respondedAt = new Date();
      await fundRequest.save();

      const declineMsg = fundRequest.requestType === 'settlement'
        ? 'Settlement payment declined.'
        : 'Fund request declined.';

      return res.json({ 
        message: declineMsg,
        request: fundRequest,
      });
    } else {
      return res.status(400).json({ message: "Invalid action. Must be 'accept' or 'decline'." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to respond to request' });
  }
};

// @desc    Cancel a request (Requester only)
// @route   DELETE /api/requests/:id
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const fundRequest = await FundRequest.findById(id);
    if (!fundRequest) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (fundRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the creator can cancel this request.' });
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a request that is already ${fundRequest.status}.` });
    }

    fundRequest.status = 'cancelled';
    await fundRequest.save();

    res.json({ message: 'Request cancelled.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
