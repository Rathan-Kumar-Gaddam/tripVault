import mongoose from 'mongoose';

const fundRequestSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    requestType: { 
      type: String, 
      enum: ['fund_request', 'settlement'], 
      default: 'fund_request',
      required: true 
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Companion being asked or Settlement recipient
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

// Indexes for fast lookup of active requests and user notifications
fundRequestSchema.index({ tripId: 1, status: 1 });
fundRequestSchema.index({ requester: 1 });
fundRequestSchema.index({ targetUser: 1 });

export default mongoose.model('FundRequest', fundRequestSchema);
