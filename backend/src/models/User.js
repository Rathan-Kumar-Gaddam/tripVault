import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // True if created by an Admin; forces them to change password on first login
    requiresPasswordChange: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);