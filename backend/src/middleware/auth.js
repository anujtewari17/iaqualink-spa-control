import dotenv from 'dotenv';
import accessKeyService from '../services/accessKeyService.js';

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
  const valid = await accessKeyService.validateKey(key);
  if (valid) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};
