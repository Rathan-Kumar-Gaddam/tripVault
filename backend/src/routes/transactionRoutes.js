import express from 'express';
import { logTransaction, getTransactions, deleteTransaction } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, logTransaction);

router.route('/:tripId')
  .get(protect, getTransactions);

router.route('/:id')
  .delete(protect, deleteTransaction);

export default router;