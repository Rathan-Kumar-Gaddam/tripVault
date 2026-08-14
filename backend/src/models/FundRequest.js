import mongoose from 'mongoose';

const fundRequestSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Companion being asked
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'Loan / Cash' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('FundRequest', fundRequestSchema);
