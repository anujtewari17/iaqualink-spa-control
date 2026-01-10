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
  // We now use a universal model: Admin sees the current reservation slot
  const currentRes = accessKeyService.getCurrentReservation();
  const guestKey = currentRes ? currentRes.code : 'katmaiguest';

  // Check if EITHER the current specific reservation is paid OR the generic guest key is paid
  const isSpecificPaid = paidAccessService.isPaid(guestKey);
  const isGenericPaid = paidAccessService.isPaid('katmaiguest');
  const isPaid = isSpecificPaid || isGenericPaid;

  // Get the correct metadata from the paid source
  const activeKey = isSpecificPaid ? guestKey : (isGenericPaid ? 'katmaiguest' : null);
  const latestPayment = activeKey ? (paidAccessService.payments || [])
    .filter(p => p.accessKey === activeKey)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;

  let expiry = null;
  if (latestPayment) {
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
      nights: latestPayment?.nights || 0,
      // Provide dates if we have them from a reservation
      start: currentRes?.start,
      end: currentRes?.end
    }
  });
});

export default router;
