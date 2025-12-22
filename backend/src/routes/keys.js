import express from 'express';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

// Return the currently active reservation
router.get('/', async (req, res) => {
  const key = req.headers['x-access-key'];
  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Import services
  const paymentService = (await import('../services/paymentService.js')).default;
  const paidAccessService = (await import('../services/paidAccessService.js')).default;

  const allReservations = accessKeyService.getAllReservations();

  const enrichedReservations = allReservations.map(r => {
    const nights = paymentService.calculateNights(r.start, r.end);
    return {
      code: r.code,
      url: r.url,
      start: r.start,
      end: r.end,
      nights,
      guestName: r.guestName || 'Guest',
      totalPrice: nights * 25.0,
      isPaid: paidAccessService.isPaid(r.code)
    };
  });

  res.json({ reservations: enrichedReservations });
});

export default router;
