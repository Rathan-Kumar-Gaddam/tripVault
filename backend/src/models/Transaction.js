import mongoose from 'mongoose';

const splitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    type: { 
      type: String, 
      enum: ['expense', 'settlement', 'contribution'], 
      default: 'expense',
      required: true 
    },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: { 
      type: String, 
      enum: ['all', 'individual', 'custom'], 
      default: 'all' 
    },
    splits: [splitSchema],
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);