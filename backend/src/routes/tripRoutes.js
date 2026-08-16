import express from 'express';
import { 
  createTrip, 
  addMember, 
  removeMember, 
  getTripById, 
  getUserTrips, 
  updateTrip,
  deleteTrip,
  joinTrip,
  getTripPreview,
  leaveTrip 
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createTrip)
  .get(protect, getUserTrips);

router.route('/:tripId/preview')
  .get(getTripPreview);

router.route('/:tripId/join')
  .post(protect, joinTrip);

router.route('/:tripId/leave')
  .post(protect, leaveTrip);

router.route('/:tripId')
  .get(protect, getTripById)
  .put(protect, updateTrip)
  .delete(protect, deleteTrip);

router.route('/:tripId/members')
  .post(protect, addMember);

router.route('/:tripId/members/:memberUserId')
  .delete(protect, removeMember);

export default router;