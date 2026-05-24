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

// Return all logged sessions for the last 60 days (requires admin key)
router.get('/sessions', async (req, res) => {
  const key = req.headers['x-access-key'];
  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await usageLogger.ready;
  
  // Sort sessions by start date descending (most recent first)
  const sortedSessions = [...usageLogger.sessions].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
  
  res.json(sortedSessions);
});

export default router;
