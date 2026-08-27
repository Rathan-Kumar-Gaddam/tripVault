import express from 'express';
import { registerUser, loginUser, loginPhone, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-phone', loginPhone);

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;