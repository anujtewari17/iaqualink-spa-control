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
  // We now use a universal 'katmaiguest' identity for all guest interactions
  const guestKey = 'katmaiguest';
  const isPaid = paidAccessService.isPaid(guestKey);

  // Find the latest payment to determine expiry
  const latestPayment = (paidAccessService.payments || [])
    .filter(p => p.accessKey === guestKey)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  let expiry = null;
  if (isPaid && latestPayment) {
    const nights = latestPayment.nights || 1;
    const paymentTime = new Date(latestPayment.timestamp);
    const expiryDate = new Date(paymentTime);
    expiryDate.setDate(expiryDate.getDate() + nights);
    expiryDate.setHours(13, 0, 0, 0); // 1 PM checkout
    expiry = expiryDate.toISOString();
  }

  res.json({
    guestStatus: {
      code: guestKey,
      isPaid,
      expiry,
      nights: latestPayment?.nights || 0
    }
  });
});

export default router;
