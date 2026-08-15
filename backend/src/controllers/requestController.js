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

// @desc    Respond to a request:
//          - Funder marks payment sent or declines
//          - Requester confirms receipt (creating transaction) or reports not received
//          - Settlement recipient confirms receipt or declines
// @route   PUT /api/requests/:id/respond
export const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body; 
    const userId = req.user._id.toString();

    const fundRequest = await FundRequest.findById(id)
      .populate('requester', 'name email phone avatar')
      .populate('targetUser', 'name email phone avatar');

    if (!fundRequest) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const requesterId = fundRequest.requester._id.toString();
    const targetUserId = fundRequest.targetUser._id.toString();

    // ==========================================
    // FLOW A: SETTLEMENT REQUEST
    // ==========================================
    if (fundRequest.requestType === 'settlement') {
      // Only targetUser (the recipient of settlement) can confirm receipt or decline
      if (targetUserId !== userId) {
        return res.status(403).json({ message: 'Only the recipient can confirm or decline this settlement.' });
      }

      if (fundRequest.status !== 'pending') {
        return res.status(400).json({ message: `This settlement has already been ${fundRequest.status}.` });
      }

      if (action === 'accept' || action === 'confirm_receipt') {
        // Create settlement transaction
        const transaction = await Transaction.create({
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

        await syncTripBalances(fundRequest.tripId);

        fundRequest.status = 'accepted';
        fundRequest.transactionId = transaction._id;
        fundRequest.respondedAt = new Date();
        await fundRequest.save();

        return res.json({
          message: `Settlement confirmed! Confirmed receipt of ${fundRequest.amount} from ${fundRequest.requester.name}. 🎉`,
          request: fundRequest,
          transaction,
        });
      } else if (action === 'decline') {
        fundRequest.status = 'declined';
        fundRequest.respondedAt = new Date();
        await fundRequest.save();

        return res.json({
          message: 'Settlement payment declined.',
          request: fundRequest,
        });
      } else {
        return res.status(400).json({ message: 'Invalid action for settlement request.' });
      }
    }

    // ==========================================
    // FLOW B: FUND REQUEST (2-STEP HANDSHAKE)
    // ==========================================
    if (fundRequest.requestType === 'fund_request') {
      
      // Step 2: Funder (targetUser) marks payment sent or declines
      if (fundRequest.status === 'pending') {
        if (targetUserId !== userId) {
          return res.status(403).json({ message: 'Only the requested companion can fund or decline this request.' });
        }

        if (action === 'mark_sent' || action === 'pay' || action === 'accept') {
          fundRequest.status = 'payment_sent';
          fundRequest.paymentSentAt = new Date();
          if (note) fundRequest.paymentNote = note.trim();
          await fundRequest.save();

          return res.json({
            message: `Marked as sent! ${fundRequest.requester.name} will confirm receipt before the transaction is logged. 📩`,
            request: fundRequest,
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
          return res.status(400).json({ message: "Invalid action. Must be 'mark_sent' or 'decline'." });
        }
      }

      // Step 3: Requester confirms receipt or reports not received
      if (fundRequest.status === 'payment_sent') {
        if (requesterId !== userId) {
          return res.status(403).json({ message: 'Only the requester can confirm receipt of the funds.' });
        }

        if (action === 'confirm_receipt' || action === 'accept') {
          // Requester confirmed receipt -> Officially log the transaction in the ledger
          const transaction = await Transaction.create({
            tripId: fundRequest.tripId,
            type: 'expense',
            amount: fundRequest.amount,
            description: `Covered by ${fundRequest.targetUser.name}: ${fundRequest.description}`,
            category: fundRequest.category || 'Loan / Cash',
            payer: fundRequest.targetUser._id, // Funder is the payer
            splitType: 'individual',
            splits: [{ user: fundRequest.requester._id, amount: fundRequest.amount }],
            sharedBy: [fundRequest.requester._id],
            createdBy: fundRequest.targetUser._id,
          });

          await syncTripBalances(fundRequest.tripId);

          fundRequest.status = 'accepted';
          fundRequest.transactionId = transaction._id;
          fundRequest.respondedAt = new Date();
          await fundRequest.save();

          return res.json({
            message: `Receipt confirmed! Expense of ${fundRequest.amount} successfully logged in vault. 🎉`,
            request: fundRequest,
            transaction,
          });
        } else if (action === 'not_received') {
          // Reset to pending so funder is alerted and can resend
          fundRequest.status = 'pending';
          fundRequest.paymentSentAt = null;
          await fundRequest.save();

          return res.json({
            message: `Marked as not received. ${fundRequest.targetUser.name} has been notified to check their transfer.`,
            request: fundRequest,
          });
        } else {
          return res.status(400).json({ message: "Invalid action. Must be 'confirm_receipt' or 'not_received'." });
        }
      }

      return res.status(400).json({ message: `This request is already ${fundRequest.status}.` });
    }

    return res.status(400).json({ message: 'Unknown request type.' });
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
