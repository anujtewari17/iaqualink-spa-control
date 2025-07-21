import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import spaRoutes from './routes/spa.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import cron from 'node-cron';
import iaqualinkService from './services/iaqualink.js';
import axios from 'axios';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Security middleware
app.use(helmet());
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Basic request logging
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl}`
  );
  if (req.body && Object.keys(req.body).length) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
// Authentication middleware (uses ACCESS_KEY if set)
app.use('/api', authMiddleware, spaRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin: ${corsOptions.origin}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Cron job to turn off equipment nightly at 12 AM Pacific Time
cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      console.log('Nightly shutdown triggered');
      await iaqualinkService.turnOffAllEquipment();
      console.log('Nightly shutdown completed');
    } catch (err) {
      console.error('Cron job failed:', err.message);
    }
  },
  { timezone: 'America/Los_Angeles' }
);

// Heartbeat to keep Render service awake
const HEARTBEAT_URL = process.env.HEARTBEAT_URL || `http://localhost:${PORT}/health`;
cron.schedule('*/14 * * * *', async () => {
  try {
    await axios.get(HEARTBEAT_URL);
    console.log(`Heartbeat ping to ${HEARTBEAT_URL}`);
  } catch (err) {
    console.error('Heartbeat failed:', err.message);
  }
});

export default app;
