import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'super_secret_tripvault_key_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

const formatUserResponse = (user, token) => {
  const resObj = {
    _id: user._id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    hasPassword: !!user.password,
    requiresPasswordChange: !!user.requiresPasswordChange,
  };
  if (token) {
    resObj.token = token;
  }
  return resObj;
};

// @desc    Register a new user or claim an invited companion account
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'An account already exists with this email address.' });
    }

    let cleanPhone = undefined;
    if (phone && phone.toString().trim()) {
      cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (cleanPhone) {
      const existingPhoneUser = await User.findOne({ phone: cleanPhone });
      if (existingPhoneUser) {
        if (existingPhoneUser.password) {
          return res.status(400).json({ 
            message: 'An account with this phone number already exists. Please sign in with your email or phone.' 
          });
        }
        // Claim/upgrade companion account created without a password
        existingPhoneUser.name = name.trim();
        existingPhoneUser.email = cleanEmail;
        existingPhoneUser.password = hashedPassword;
        user = await existingPhoneUser.save();
      }
    }

    if (!user) {
      user = await User.create({ 
        name: name.trim(), 
        email: cleanEmail, 
        phone: cleanPhone, 
        password: hashedPassword 
      });
    }

    res.status(201).json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already associated with another account.` });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Auth user with Email & Password & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(401).json({ 
        message: 'This account was invited by phone without a password. Please sign in using your Phone Number or register your password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

// @desc    Auth user via Phone number & get token
// @route   POST /api/auth/login-phone
export const loginPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Please provide a 10-digit phone number.' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with this 10-digit phone number. Ask your trip admin to add you or create a new account.' 
      });
    }

    res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Phone login failed' });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch profile' });
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
      if (phone && phone.toString().trim()) {
        const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
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
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
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

    res.json(formatUserResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already associated with another account.` });
    }
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
};