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
    upiId: user.upiId || '',
    hasPassword: !!user.password,
    requiresPasswordChange: !!user.requiresPasswordChange,
  };
  if (token) {
    resObj.token = token;
  }
  return resObj;
};

// @desc    Fast 1-tap sign-in with phone number only (No OTP, No Password)
// @route   POST /api/auth/login-phone
export const loginPhone = async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Please provide a 10-digit phone number.' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // If user does not exist and name is provided, create new profile immediately
      if (name && name.trim()) {
        user = await User.create({
          name: name.trim(),
          phone: cleanPhone,
        });
      } else {
        // Return signal to frontend to prompt for user's Name
        return res.status(200).json({
          requiresName: true,
          message: 'Welcome! Please enter your name to complete your passbook profile.',
        });
      }
    }

    res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Phone sign-in failed' });
  }
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
            message: 'An account with this phone number already exists. Please sign in with your email or mobile.' 
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

// @desc    Auth user with Email or Phone & Password & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const input = (identifier || email || phone || '').toString().trim();

    if (!input || !password) {
      return res.status(400).json({ message: 'Please provide both email/phone and password.' });
    }

    const cleanPhone = input.replace(/\D/g, '').slice(-10);
    const isPhone = /^\d{10}$/.test(cleanPhone);
    const cleanEmail = input.toLowerCase();

    // Query user by phone or email
    let user;
    if (isPhone) {
      user = await User.findOne({ phone: cleanPhone });
    }
    if (!user) {
      user = await User.findOne({ 
        $or: [
          { email: cleanEmail },
          ...(cleanPhone.length === 10 ? [{ phone: cleanPhone }] : [])
        ] 
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. No account found with this email or phone.' });
    }

    // If user was invited by phone without a password, allow setting it directly
    if (!user.password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Please enter a password with at least 6 characters to secure your account.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      return res.json(formatUserResponse(user, generateToken(user._id)));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/phone or password.' });
    }

    res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
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
    const { name, phone, email, avatar, upiId, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (upiId !== undefined) {
      user.upiId = upiId ? upiId.trim() : '';
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
