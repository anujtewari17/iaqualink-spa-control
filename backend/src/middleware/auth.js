import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.ACCESS_KEY;

export const authMiddleware = (req, res, next) => {
  if (!ACCESS_KEY) {
    return next();
  }

  const key = req.headers['x-access-key'];
  if (key && key === ACCESS_KEY) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
