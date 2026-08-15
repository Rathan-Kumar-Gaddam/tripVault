import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/db.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

// Robust environment variable loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to Database
connectDB();

const app = express();

// Performance & Memory Middleware
app.use(helmet());
app.use(cors());
app.use(compression()); // Gzip/Brotli response compression to minimize memory & payload footprint
app.use(express.json({ limit: '10mb' })); // Parses incoming JSON requests with photo support
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints for UptimeRobot / cron keep-alive
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    service: 'TripVault API' 
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/requests', requestRoutes);

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
