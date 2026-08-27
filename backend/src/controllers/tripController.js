import Trip from '../models/Trip.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Transaction from '../models/Transaction.js';
import FundRequest from '../models/FundRequest.js';
import { registerTripClient, broadcastTripEvent } from '../services/sseService.js';
import { syncTripBalances } from './transactionController.js';

// @desc    Create a new trip (User becomes Admin)
// @route   POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const { 
      name, 
      destination, 
      category, 
      icon, 
      coverPhoto,
      startDate, 
      endDate, 
      description, 
      currency, 
      budget,
      initialMembers 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Trip destination or name is required.' });
    }

    const membersList = [{ user: req.user._id, role: 'admin', balance: 0 }];

    // If user provided initial companions during creation
    if (Array.isArray(initialMembers) && initialMembers.length > 0) {
      for (const m of initialMembers) {
        if (m && m.name && m.name.trim() && m.phone) {
          const cleanPhone = m.phone.toString().replace(/\D/g, '');
          if (/^\d{10}$/.test(cleanPhone)) {
            // Find or Create User by phone
            let companionUser = await User.findOne({ phone: cleanPhone });
            if (!companionUser) {
              companionUser = await User.create({
                name: m.name.trim(),
                phone: cleanPhone,
              });
            }

            // Ensure not already in members
            if (!membersList.some(mem => mem.user.toString() === companionUser._id.toString())) {
              membersList.push({
                user: companionUser._id,
                role: 'member',
                balance: 0,
              });
            }
          }
        }
      }
    }

    const trip = await Trip.create({
      name: name.trim(),
      destination: destination?.trim() || name.trim(),
      category: category?.trim() || 'Vacation',
      icon: icon?.trim() || '🗺️',
      coverPhoto: coverPhoto?.trim() || '',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description: description?.trim() || '',
      currency: currency?.trim() || '₹',
      budget: Number(budget) > 0 ? Number(budget) : 0,
      members: membersList,
    });

    const populatedTrip = await Trip.findById(trip._id).populate('members.user', 'name phone avatar upiId');
    res.status(201).json(populatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin adds a member to the trip
// @route   POST /api/trips/:tripId/members
export const addMember = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { tripId } = req.params;
    const requesterId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Member name is required.' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // Strip all non-digit characters
    const cleanPhone = phone.toString().replace(/\D/g, '');

    // Validate exactly 10 digits
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });

    // Validate Requester is Admin
    const isAdmin = trip.members.some(
      (m) => m.user.toString() === requesterId.toString() && m.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members.' });

    // Find or Create User by phone
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      user = await User.create({
        name: name.trim(),
        phone: cleanPhone,
      });
    }

    // Check if user is already in this trip
    const alreadyInTrip = trip.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyInTrip) {
      return res.status(400).json({ message: `${name} is already a member of this trip.` });
    }

    // Add to Trip
    trip.members.push({ user: user._id, role: 'member', balance: 0 });
    await trip.save();
    await syncTripBalances(tripId);

    // Populate member details before sending response
    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    broadcastTripEvent(tripId, 'MEMBER_ADDED', { user: user.name });
    res.status(200).json({ message: 'Member added successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add member' });
  }
};

// @desc    Get trip preview info for invite links (public / authenticated)
// @route   GET /api/trips/:tripId/preview
export const getTripPreview = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('members.user', 'name avatar')
      .lean();
    if (!trip) return res.status(404).json({ message: 'Trip vault not found.' });

    const admin = trip.members.find(m => m.role === 'admin');

    res.json({
      _id: trip._id,
      name: trip.name,
      currency: trip.currency,
      memberCount: trip.members.length,
      destination: trip.destination,
      coverPhoto: trip.coverPhoto || '',
      adminName: admin?.user?.name || 'Organizer',
      createdAt: trip.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch trip preview' });
  }
};

// @desc    Join a trip using an invite link (supports member or viewer role)
// @route   POST /api/trips/:tripId/join
export const joinTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { role } = req.body; // 'member' | 'viewer'
    const userId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });

    const memberRole = (role === 'viewer') ? 'viewer' : 'member';

    // Check if user is already a member
    const alreadyInTrip = trip.members.some((m) => m.user.toString() === userId.toString());
    if (alreadyInTrip) {
      const populated = await Trip.findById(tripId)
        .populate('members.user', 'name email phone avatar upiId')
        .lean();
      return res.status(200).json({ message: 'Already a member of this trip.', trip: populated });
    }

    // Add user with specified role
    trip.members.push({ user: userId, role: memberRole, balance: 0 });
    await trip.save();
    await syncTripBalances(tripId);

    const populated = await Trip.findById(tripId)
      .populate('members.user', 'name email phone avatar upiId')
      .lean();
    broadcastTripEvent(tripId, 'MEMBER_JOINED', { user: req.user.name });
    res.status(200).json({ message: `Successfully joined ${trip.name}!`, trip: populated });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to join trip' });
  }
};

// @desc    Close / Settle & Freeze a trip vault
// @route   POST /api/trips/:tripId/close
export const closeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { reopen } = req.body;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });

    // Validate requester is admin or member
    const isMember = trip.members.some((m) => (m.user?._id || m.user).toString() === requesterId.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied.' });

    trip.isClosed = reopen ? false : true;
    await trip.save();

    const updatedTrip = await Trip.findById(tripId)
      .populate('members.user', 'name email phone avatar upiId');

    broadcastTripEvent(tripId, 'VAULT_STATUS_CHANGED', { isClosed: trip.isClosed });

    res.status(200).json({
      message: reopen ? 'Trip vault reopened!' : 'Trip vault successfully settled and closed! 🔒',
      trip: updatedTrip
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update vault status' });
  }
};

// @desc    Get trip details (accessible by any member in the trip)
// @route   GET /api/trips/:tripId
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('members.user', 'name email phone avatar')
      .lean();
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Ensure the requester is part of the trip
    const isMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === req.user._id.toString();
    });
    
    if (!isMember) return res.status(403).json({ message: 'Access denied. You must join this trip first.' });

    // Count pending requests where logged-in user must act
    const pendingCount = await FundRequest.countDocuments({
      tripId: trip._id,
      $or: [
        { targetUser: req.user._id, status: 'pending' },
        { requester: req.user._id, status: 'payment_sent' },
      ],
    });

    // Calculate total expenses dynamically
    const transactions = await Transaction.find({ tripId: trip._id }).lean();
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    trip.totalExpenses = totalExpenses;
    trip.pendingRequestsCount = pendingCount;
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trips for the logged-in user
// @route   GET /api/trips
export const getUserTrips = async (req, res) => {
  try {
    const userId = req.user._id;
    const trips = await Trip.find({ 'members.user': userId })
      .populate('members.user', 'name email phone avatar')
      .sort({ updatedAt: -1 })
      .lean();

    // Query active requests where user must act across all user trips
    const activeRequests = await FundRequest.find({
      $or: [
        { targetUser: userId, status: 'pending' },
        { requester: userId, status: 'payment_sent' },
      ],
    }).select('tripId').lean();

    const requestCountMap = {};
    activeRequests.forEach((r) => {
      const tId = r.tripId.toString();
      requestCountMap[tId] = (requestCountMap[tId] || 0) + 1;
    });

    // Aggregate total expenses per trip
    const tripIds = trips.map((t) => t._id);
    const expensesAggregate = await Transaction.aggregate([
      { $match: { tripId: { $in: tripIds }, type: 'expense' } },
      { $group: { _id: '$tripId', total: { $sum: '$amount' } } },
    ]);

    const expenseMap = {};
    expensesAggregate.forEach((e) => {
      expenseMap[e._id.toString()] = e.total;
    });

    const tripsWithNotifications = trips.map((t) => ({
      ...t,
      totalExpenses: expenseMap[t._id.toString()] || 0,
      pendingRequestsCount: requestCountMap[t._id.toString()] || 0,
    }));

    res.json(tripsWithNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update trip details (name, currency, budget, destination, coverPhoto)
// @route   PUT /api/trips/:tripId
export const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { name, destination, currency, budget, coverPhoto } = req.body;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate requester is member (or admin)
    const isMember = trip.members.some((m) => {
      const uId = (m.user?._id || m.user)?.toString();
      return uId && uId === requesterId.toString();
    });
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    if (name !== undefined && name.trim()) trip.name = name.trim();
    if (destination !== undefined) trip.destination = destination;
    if (currency !== undefined && currency.trim()) trip.currency = currency.trim();
    if (budget !== undefined) trip.budget = Math.max(0, Number(budget) || 0);
    if (coverPhoto !== undefined) trip.coverPhoto = coverPhoto.trim();

    await trip.save();

    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin deletes a trip and all its transactions and fund requests
// @route   DELETE /api/trips/:tripId
export const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate Requester is Admin or Sole Member
    const isAdmin = trip.members.some(
      (m) => (m.user?._id || m.user).toString() === requesterId.toString() && m.role === 'admin'
    );
    const isSingleMember = trip.members.length === 1 && (trip.members[0].user?._id || trip.members[0].user).toString() === requesterId.toString();
    
    if (!isAdmin && !isSingleMember) {
      return res.status(403).json({ message: 'Only trip admins can delete this trip vault.' });
    }

    // 1. Delete all transactions associated with this trip
    await Transaction.deleteMany({ tripId });

    // 2. Delete all fund requests associated with this trip
    await FundRequest.deleteMany({ tripId });

    // 3. Delete the trip itself
    await trip.deleteOne();

    res.status(200).json({ message: 'Trip vault permanently deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete trip' });
  }
};

// @desc    Member leaves a trip vault
// @route   POST /api/trips/:tripId/leave
export const leaveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const memberIndex = trip.members.findIndex(
      (m) => (m.user?._id || m.user).toString() === requesterId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this trip vault.' });
    }

    // If the user is the only member, delete the trip completely
    if (trip.members.length === 1) {
      await Transaction.deleteMany({ tripId });
      await FundRequest.deleteMany({ tripId });
      await trip.deleteOne();
      return res.status(200).json({ message: 'Left and deleted trip vault.' });
    }

    const leavingMember = trip.members[memberIndex];
    // If leaving member is admin and there are no other admins, promote next member
    if (leavingMember.role === 'admin') {
      const otherAdmins = trip.members.filter(
        (m, idx) => idx !== memberIndex && m.role === 'admin'
      );
      if (otherAdmins.length === 0) {
        const nextMember = trip.members.find((_, idx) => idx !== memberIndex);
        if (nextMember) nextMember.role = 'admin';
      }
    }

    // Remove member
    trip.members.splice(memberIndex, 1);
    await trip.save();

    res.status(200).json({ message: 'Successfully left the trip vault.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to leave trip' });
  }
};

// @desc    Admin removes a member from the trip, or member removes themselves
// @route   DELETE /api/trips/:tripId/members/:memberUserId
export const removeMember = async (req, res) => {
  try {
    const { tripId, memberUserId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isSelf = memberUserId.toString() === requesterId.toString();

    // Validate Requester is Admin or removing self
    const isAdmin = trip.members.some(
      (m) => (m.user?._id || m.user).toString() === requesterId.toString() && m.role === 'admin'
    );
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Only admins can remove other members.' });
    }

    // If member removing themselves, redirect to leaveTrip logic
    if (isSelf) {
      if (trip.members.length === 1) {
        await Transaction.deleteMany({ tripId });
        await FundRequest.deleteMany({ tripId });
        await trip.deleteOne();
        return res.status(200).json({ message: 'Left and deleted trip vault.' });
      }

      const selfIndex = trip.members.findIndex(
        (m) => (m.user?._id || m.user).toString() === requesterId.toString()
      );
      if (selfIndex !== -1) {
        const leavingMember = trip.members[selfIndex];
        if (leavingMember.role === 'admin') {
          const otherAdmins = trip.members.filter((m, idx) => idx !== selfIndex && m.role === 'admin');
          if (otherAdmins.length === 0) {
            const nextMember = trip.members.find((_, idx) => idx !== selfIndex);
            if (nextMember) nextMember.role = 'admin';
          }
        }
        trip.members.splice(selfIndex, 1);
        await trip.save();
        return res.status(200).json({ message: 'Successfully left the trip.' });
      }
    }

    // Find member index to remove
    const memberIndex = trip.members.findIndex(
      (m) => (m.user?._id || m.user).toString() === memberUserId.toString()
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this trip.' });
    }

    trip.members.splice(memberIndex, 1);
    await trip.save();

    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    broadcastTripEvent(tripId, 'MEMBER_REMOVED', { memberUserId });
    res.status(200).json({ message: 'Member removed successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove member' });
  }
};

// @desc    Live Server-Sent Events stream for real-time trip synchronization
// @route   GET /api/trips/:tripId/events
export const streamTripEvents = (req, res) => {
  const { tripId } = req.params;

  // Prevent socket timeout on long-lived SSE connections
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  registerTripClient(tripId, res);
};