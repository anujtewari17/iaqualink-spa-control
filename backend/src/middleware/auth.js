import dotenv from 'dotenv';
import accessKeyService from '../services/accessKeyService.js';
import sessionService from '../services/sessionService.js';

dotenv.config();

if (!process.env.ACCESS_KEY) {
  console.error('ACCESS_KEY environment variable must be set for security');
  process.exit(1);
}

export const authMiddleware = async (req, res, next) => {
  let key = req.headers['x-access-key'];
  if (!key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  key = String(key).trim().toLowerCase();

  // Validate the key first
  const valid = await accessKeyService.validateKey(key);
  if (!valid) {
    console.log(`[Auth] Invalid key: ${key}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Allow session routes to be accessed without an active session
  if (req.baseUrl.includes('/sessions') || req.path.includes('/sessions')) {
      return next();
  }

  // Check active session status for all other routes
  const hasSession = await sessionService.hasActiveSession(key);

  if (!hasSession) {
    return res.status(402).json({
      error: 'Session Required',
      message: 'You must activate a session to access spa controls.'
    });
  }

  return next();
};
