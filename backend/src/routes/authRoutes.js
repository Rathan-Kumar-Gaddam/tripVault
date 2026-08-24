import express from 'express';
import {registerUser, loginUser, loginPhone, sendPhoneOtp, verifyPhoneOtp, getProfile, updateProfile, getSmsBalance } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-phone', loginPhone);
router.post('/send-otp', sendPhoneOtp);
router.post('/verify-otp', verifyPhoneOtp);
router.get('/sms-balance', protect, getSmsBalance);

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;