import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import spaRoutes from './routes/spa.js';
import keyRoutes from './routes/keys.js';
import sessionRoutes from './routes/sessions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import cron from 'node-cron';
import iaqualinkService from './services/iaqualink.js';
import sessionService from './services/sessionService.js';
import usageLogger from './services/usageLogger.js';

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

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
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
  res.status(200).send('OK');
});

// API routes
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api', authMiddleware, spaRoutes);
app.use('/api/keys', authMiddleware, keyRoutes);

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

// Auto-shutdown for expired sessions (runs every minute)
cron.schedule('* * * * *', async () => {
  try {
    // 1. Check for expired guest sessions
    const expired = await sessionService.getAndClearNewlyExpiredSessions();
    if (expired.length > 0) {
      console.log(`[Cron] Found ${expired.length} newly expired sessions. Shutting down spa...`);
      await iaqualinkService.turnOffAllEquipment();
      return; // Skip the global check if we just shut it down
    }

    // 2. Global 3-Hour Safety Watchdog (covers official app usage too)
    const status = await iaqualinkService.getSpaStatus();
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const WATCHDOG_KEY = 'global_spa_start_time';
    const MAX_ON_TIME_MS = 3 * 60 * 60 * 1000;

    if (status.spaMode) {
      let startTime = null;
      
      // Try to get start time from Redis
      if (redisUrl && redisToken) {
        const res = await fetch(redisUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', WATCHDOG_KEY])
        });
        const data = await res.json();
        if (data.result) startTime = parseInt(data.result);
      }

      if (!startTime) {
        startTime = Date.now();
        console.log(`[Watchdog] Spa detected ON. Starting 3-hour timer...`);
        if (redisUrl && redisToken) {
          await fetch(redisUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(['SET', WATCHDOG_KEY, startTime.toString()])
          });
        }
      } else {
        const elapsed = Date.now() - startTime;
        const remainingMins = Math.max(0, Math.ceil((MAX_ON_TIME_MS - elapsed) / 60000));
        console.log(`[Watchdog] Spa has been running for ${Math.round(elapsed / 60000)} mins. ${remainingMins} mins left.`);
        
        if (elapsed >= MAX_ON_TIME_MS) {
          console.log(`[Watchdog] 3-hour limit reached. Shutting down everything!`);
          await iaqualinkService.turnOffAllEquipment();
          if (redisUrl && redisToken) {
            await fetch(redisUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(['DEL', WATCHDOG_KEY])
            });
          }
        }
      }
    } else {
      // Spa is off, clear the watchdog timer
      if (redisUrl && redisToken) {
        await fetch(redisUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', WATCHDOG_KEY])
        });
      }
    }
  } catch (err) {
    console.error('[Cron] Watchdog check failed:', err.message);
  }
});

// Cron job to turn off equipment nightly at 12 AM Pacific Time (failsafe)
cron.schedule(
  '0 22,0,1,2,3,4,5 * * *',
  async () => {
    try {
      console.log('[Cron] Nightly shutdown triggered');
      await iaqualinkService.turnOffAllEquipment();
      console.log('[Cron] Nightly shutdown completed');
    } catch (err) {
      console.error('[Cron] Nightly shutdown failed:', err.message);
    }
  },
  { timezone: 'America/Los_Angeles' }
);

// Daily usage report at 1:05 AM Pacific Time
cron.schedule(
  '5 1 * * *',
  () => {
    usageLogger.dailyReport();
  },
  { timezone: 'America/Los_Angeles' }
);

export default app;
