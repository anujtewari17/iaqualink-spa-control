import express from 'express';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

// List all access keys with reservation dates
router.get('/', (req, res) => {
  const key = req.headers['x-access-key'];
  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const reservations = accessKeyService.getActiveReservations().map((r) => ({
    code: r.code,
    url: accessKeyService.generateUrl(r.code),
    start: r.start,
    end: r.end,
  }));
  res.json({ reservations });
});

export default router;
