import express from 'express';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

// List active access keys with reservation dates
router.get('/', (req, res) => {
  const reservations = accessKeyService.getActiveReservations().map(r => ({
    code: r.code,
    start: r.start,
    end: r.end
  }));
  res.json({ reservations });
});

export default router;
