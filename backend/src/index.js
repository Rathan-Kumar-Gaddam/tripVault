import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Parses incoming JSON requests with photo support
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/transactions', transactionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
