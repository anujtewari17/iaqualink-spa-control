import express from 'express';
import sessionService from '../services/sessionService.js';
import iaqualinkService from '../services/iaqualink.js';

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
        
        // Automatically turn on the spa hardware
        try {
            await iaqualinkService.turnOnSpa();
        } catch (spaErr) {
            console.error('[Sessions] Failed to auto-start hardware:', spaErr.message);
            // We don't fail the session start if the hardware fails to respond,
            // the user can still try to toggle it manually from the dashboard.
        }

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

router.post('/clear', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        if (!key) return res.status(401).json({ error: 'Missing access key' });
        
        // Ensure only admin can clear sessions manually
        if (key !== process.env.ACCESS_KEY) {
            return res.status(403).json({ error: 'Only admins can clear sessions.' });
        }

        // Clear the guest session
        await sessionService.clearSession('katmaiguest');
        res.json({ success: true, message: 'Session cleared successfully.' });
    } catch (err) {
        console.error('Session Clear Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
