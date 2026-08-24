import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: 'Phone number must be exactly 10 digits.',
      }
    },
    password: { type: String }, // Optional for members added via phone number
    avatar: { type: String, default: '' }, // Profile photo base64 data URI or URL
    upiId: { type: String, trim: true, default: '' }, // UPI ID for instant settlements e.g. name@upi
    requiresPasswordChange: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

// Enforce unique email only when email exists as a string
userSchema.index(
  { email: 1 },
  { 
    unique: true, 
    partialFilterExpression: { email: { $type: 'string' } } 
  }
);

// Enforce unique phone only when phone exists as a string
userSchema.index(
  { phone: 1 },
  { 
    unique: true, 
    partialFilterExpression: { phone: { $type: 'string' } } 
  }
);

export default mongoose.model('User', userSchema);