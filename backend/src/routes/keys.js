import express from 'express';
import sessionService from '../services/sessionService.js';
import usageLogger from '../services/usageLogger.js';

const router = express.Router();

// Return the currently active session and monthly stats
router.get('/', async (req, res) => {
  const key = req.headers['x-access-key'];
  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // The guest key is always 'katmaiguest' now
  const guestKey = 'katmaiguest';

  const session = await sessionService.getSession(guestKey);
  const monthlyStats = usageLogger.getMonthlyStats();

  res.json({
    guestStatus: {
      code: guestKey,
      active: !!session,
      endTime: session ? session.endTime : null,
    },
    monthlyStats
  });
});

export default router;
