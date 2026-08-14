import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new Admin user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email' });

    let cleanPhone = undefined;
    if (phone && phone.trim()) {
      cleanPhone = phone.trim().replace(/[\s-]/g, '');
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      name: name.trim(), 
      email: cleanEmail, 
      phone: cleanPhone,
      password: hashedPassword 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      requiresPasswordChange: user.requiresPasswordChange,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user with Email & Password & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      requiresPasswordChange: user.requiresPasswordChange,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user via Phone number & get token
// @route   POST /api/auth/login-phone
export const loginPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Please provide a phone number.' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with this 10-digit phone number. Ask your trip admin to add you.' 
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      requiresPasswordChange: user.requiresPasswordChange,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile & settings
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, avatar, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone && phone.trim()) {
        const cleanPhone = phone.toString().replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanPhone)) {
          return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
        }
        const existingPhone = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
        if (existingPhone) {
          return res.status(400).json({ message: 'This phone number is already used by another account.' });
        }
        user.phone = cleanPhone;
      } else {
        user.phone = undefined;
      }
    }

    if (email !== undefined) {
      if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ message: 'This email is already in use by another account.' });
        }
        user.email = cleanEmail;
      } else {
        user.email = undefined;
      }
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    if (newPassword && newPassword.trim()) {
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to update password.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect.' });
        }
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword.trim(), salt);
      user.requiresPasswordChange = false;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      requiresPasswordChange: user.requiresPasswordChange,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};