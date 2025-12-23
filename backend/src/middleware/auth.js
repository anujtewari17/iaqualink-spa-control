import dotenv from 'dotenv';
import accessKeyService from '../services/accessKeyService.js';
import paidAccessService from '../services/paidAccessService.js';

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

  // Admin bypass
  const adminKey = String(process.env.ACCESS_KEY).trim().toLowerCase();
  if (key === adminKey) {
    return next();
  }

  const valid = await accessKeyService.validateKey(key);
  if (!valid || accessKeyService.isKeyExpired(key)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check paid status for guest keys
  if (!paidAccessService.isPaid(key)) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Access to spa controls requires a one-time payment for your stay.'
    });
  }

  // Check if reservation is active for control routes
  const isControlRoute = req.path.includes('/toggle') || req.path.includes('/set-temperature');
  if (isControlRoute && !accessKeyService.isKeyActive(key)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your spa access window has not started yet or has already ended.'
    });
  }

  return next();
};
