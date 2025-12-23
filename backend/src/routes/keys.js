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

  // Current Airbnb guest
  const current = accessKeyService.getCurrentReservation();
  let currentGuest = null;
  if (current) {
    const nights = paymentService.calculateNights(current.start, current.end);
    currentGuest = {
      code: current.code,
      url: accessKeyService.generateUrl(current.code),
      start: current.start,
      end: current.end,
      nights,
      isPaid: paidAccessService.isPaid(current.code)
    };
  }

  // Shared generic guest link
  const sharedStatus = {
    code: 'katmaiguest',
    url: accessKeyService.generateUrl('katmaiguest'),
    isPaid: paidAccessService.isPaid('katmaiguest')
  };

  res.json({ currentGuest, sharedStatus });
});

export default router;
