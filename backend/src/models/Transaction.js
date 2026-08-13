import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    type: { type: String, enum: ['contribution', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true },
    // Array of users affected. 1 ID = Individual, Multiple IDs = Common
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);