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
    const { name, email, tempPassword } = req.body;
    const { tripId } = req.params;
    const requesterId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate Requester is Admin
    const isAdmin = trip.members.some(
      (m) => m.user.toString() === requesterId.toString() && m.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members.' });

    // Find or Create User
    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        requiresPasswordChange: true,
      });
    }

    // Check if user is already in this trip
    const alreadyInTrip = trip.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyInTrip) return res.status(400).json({ message: 'User is already in this trip.' });

    // Add to Trip
    trip.members.push({ user: user._id, role: 'member', balance: 0 });
    await trip.save();

    // Populate member details before sending response
    const updatedTrip = await Trip.findById(tripId).populate('members.user', 'name email');
    res.status(200).json({ message: 'Member added successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trip details (accessible by any member in the trip)
// @route   GET /api/trips/:tripId
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email');
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
    const trips = await Trip.find({ 'members.user': req.user._id }).populate('members.user', 'name');
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Fetches the history, newest first!
    const transactions = await Transaction.find({ tripId })
      .populate('sharedBy', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 }); 

    res.json(transactions);
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