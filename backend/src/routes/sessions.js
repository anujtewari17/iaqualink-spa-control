import express from 'express';
import sessionService from '../services/sessionService.js';

const router = express.Router();

router.post('/start', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        const { hours } = req.body;
        
        if (!key) return res.status(401).json({ error: 'Missing access key' });
        
        const duration = parseInt(hours);
        if (isNaN(duration) || duration < 1 || duration > 3) {
            return res.status(400).json({ error: 'Invalid duration. Must be 1, 2, or 3 hours.' });
        }

        await sessionService.startSession(key, duration);
        res.json({ success: true, message: `Session started for ${duration} hours.` });
    } catch (err) {
        console.error('Session Start Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/status', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        if (!key) return res.status(401).json({ error: 'Missing access key' });

        const session = await sessionService.getSession(key);
        
        // Admin logic
        if (key === process.env.ACCESS_KEY) {
             return res.json({ 
                 active: true, 
                 admin: true,
                 timeRemainingMs: null 
             });
        }

        if (session) {
            res.json({
                active: true,
                admin: false,
                durationHours: session.durationHours,
                timeRemainingMs: session.timeRemainingMs,
                endTime: session.endTime
            });
        } else {
            res.json({ active: false });
        }
    } catch (err) {
        console.error('Session Status Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
