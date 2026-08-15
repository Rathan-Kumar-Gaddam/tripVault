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
    budget: { type: Number, default: 0 },
    members: [tripMemberSchema],
    totalVault: { type: Number, default: 0 }, // Total contributions injected into the trip
  },
  { timestamps: true }
);

// Indexes for fast lookup on user's trips
tripSchema.index({ 'members.user': 1, updatedAt: -1 });

export default mongoose.model('Trip', tripSchema);