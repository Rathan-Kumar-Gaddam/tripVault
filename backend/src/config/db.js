import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy non-sparse indexes and sync partialFilterExpression indexes
    try {
      await User.collection.updateMany({ email: null }, { $unset: { email: '' } });
      await User.collection.updateMany({ phone: null }, { $unset: { phone: '' } });
      await User.syncIndexes();
      console.log('MongoDB User indexes synchronized successfully');
    } catch (idxErr) {
      console.warn('Index sync note:', idxErr.message);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;