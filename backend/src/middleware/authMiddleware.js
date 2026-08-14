import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      const secret = process.env.JWT_SECRET || 'super_secret_tripvault_key_2026';
      const decoded = jwt.verify(token, secret);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found or account removed' });
      }
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed or invalid' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};