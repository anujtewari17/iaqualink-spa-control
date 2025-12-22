import dotenv from 'dotenv';
import accessKeyService from '../services/accessKeyService.js';
import paidAccessService from '../services/paidAccessService.js';

dotenv.config();

const ADMIN_KEY = process.env.ACCESS_KEY;

if (!ADMIN_KEY) {
  console.error('ACCESS_KEY environment variable must be set for security');
  process.exit(1);
}

export const authMiddleware = async (req, res, next) => {
  const key = req.headers['x-access-key'];
  if (!key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admin bypass
  if (key === ADMIN_KEY) {
    return next();
  }

  const valid = await accessKeyService.validateKey(key);
  if (!valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check paid status for guest keys - ONLY for control routes
  const isControlRoute = req.path.includes('/toggle') || req.path.includes('/set-temperature');
  if (isControlRoute && !paidAccessService.isPaid(key)) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Access to spa controls requires a one-time payment for your stay.'
    });
  }

  return next();
};
