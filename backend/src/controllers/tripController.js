import Trip from '../models/Trip.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Transaction from '../models/Transaction.js';
// @desc    Create a new trip (User becomes Admin)
// @route   POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const { name, destination, currency } = req.body;

    const trip = await Trip.create({
      name,
      destination,
      currency: currency || '₹',
      members: [{ user: req.user._id, role: 'admin', balance: 0 }],
    });

    res.status(201).json(trip);
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

    // Populate member details before sending response
    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    res.status(200).json({ message: 'Member added successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add member' });
  }
};

// @desc    Get trip details (accessible by any member in the trip)
// @route   GET /api/trips/:tripId
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email phone avatar');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Ensure the requester is part of the trip
    const isMember = trip.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trips for the logged-in user
// @route   GET /api/trips
export const getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ 'members.user': req.user._id }).populate('members.user', 'name email phone avatar');
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update trip details (name, currency, budget, destination)
// @route   PUT /api/trips/:tripId
export const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { name, destination, currency, budget } = req.body;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate requester is member (or admin)
    const isMember = trip.members.some((m) => m.user.toString() === requesterId.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    if (name !== undefined && name.trim()) trip.name = name.trim();
    if (destination !== undefined) trip.destination = destination;
    if (currency !== undefined && currency.trim()) trip.currency = currency.trim();
    if (budget !== undefined) trip.budget = Math.max(0, Number(budget) || 0);

    await trip.save();

    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Admin deletes a trip and all its transactions
// @route   DELETE /api/trips/:tripId
export const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate Requester is Admin
    const isAdmin = trip.members.some(
      (m) => m.user.toString() === requesterId.toString() && m.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can delete this trip.' });
    }

    // 1. Delete all transactions associated with this trip
    await Transaction.deleteMany({ tripId });

    // 2. Delete the trip itself
    await trip.deleteOne();

    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin removes a member from the trip
// @route   DELETE /api/trips/:tripId/members/:memberUserId
export const removeMember = async (req, res) => {
  try {
    const { tripId, memberUserId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate Requester is Admin
    const isAdmin = trip.members.some(
      (m) => m.user.toString() === requesterId.toString() && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove members.' });
    }

    // Prevent removing self
    if (memberUserId.toString() === requesterId.toString()) {
      return res.status(400).json({ message: 'Trip admin cannot be removed from the trip.' });
    }

    // Find member index
    const memberIndex = trip.members.findIndex(
      (m) => m.user.toString() === memberUserId.toString()
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this trip.' });
    }

    trip.members.splice(memberIndex, 1);
    await trip.save();

    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email phone avatar');
    res.status(200).json({ message: 'Member removed successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove member' });
  }
};