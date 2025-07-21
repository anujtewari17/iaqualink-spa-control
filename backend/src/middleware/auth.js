import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.ACCESS_KEY;

if (!ACCESS_KEY) {
  console.error('ACCESS_KEY environment variable must be set for security');
  process.exit(1);
}

export const authMiddleware = (req, res, next) => {
  const key = req.headers['x-access-key'];
  if (key && key === ACCESS_KEY) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
