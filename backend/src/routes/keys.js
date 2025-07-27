import express from 'express';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

// Return the currently active reservation
router.get('/', (req, res) => {
  const key = req.headers['x-access-key'];
  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const [r] = accessKeyService.getActiveReservations();
  const reservation =
    r && {
      code: r.code,
      url: accessKeyService.generateUrl(r.code),
      start: r.start,
      end: r.end,
    };
  res.json({ reservation });
});

export default router;
