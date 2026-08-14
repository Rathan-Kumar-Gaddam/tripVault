import express from 'express';
import { createTrip, addMember, removeMember, getTripById, getUserTrips, deleteTrip } from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createTrip)
  .get(protect, getUserTrips);

router.route('/:tripId')
  .get(protect, getTripById)
  .delete(protect, deleteTrip);

router.route('/:tripId/members')
  .post(protect, addMember);

router.route('/:tripId/members/:memberUserId')
  .delete(protect, removeMember);

export default router;