import mongoose from 'mongoose';

const tripMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  balance: { type: Number, default: 0 }, // Positive = Owed to them, Negative = They owe
});

const tripSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destination: { type: String },
    category: { type: String, default: 'Vacation' },
    icon: { type: String, default: '🗺️' },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, default: '' },
    currency: { type: String, default: '₹' },
    budget: { type: Number, default: 0 },
    members: [tripMemberSchema],
    totalVault: { type: Number, default: 0 }, // Total contributions injected into the trip
    isClosed: { type: Boolean, default: false }, // Archived/closed trip freeze state
  },
  { timestamps: true }
);

// Indexes for fast lookup on user's trips
tripSchema.index({ 'members.user': 1, updatedAt: -1 });

export default mongoose.model('Trip', tripSchema);