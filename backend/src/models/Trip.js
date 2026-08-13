import mongoose from 'mongoose';

const tripMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  balance: { type: Number, default: 0 }, // Positive = Owed to them, Negative = They owe
});

const tripSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destination: { type: String },
    currency: { type: String, default: '₹' },
    members: [tripMemberSchema],
    totalVault: { type: Number, default: 0 }, // Total contributions injected into the trip
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);