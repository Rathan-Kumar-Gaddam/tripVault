import express from 'express';
import { 
  createRequest, 
  getTripRequests, 
  respondToRequest, 
  cancelRequest 
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createRequest);

router.route('/trip/:tripId')
  .get(protect, getTripRequests);

router.route('/:id/respond')
  .put(protect, respondToRequest);

router.route('/:id')
  .delete(protect, cancelRequest);

export default router;
