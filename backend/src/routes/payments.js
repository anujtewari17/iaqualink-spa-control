import express from 'express';
import paymentService from '../services/paymentService.js';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        if (!key) return res.status(401).json({ error: 'Unauthorized' });

        const isValid = await accessKeyService.validateKey(key);
        if (!isValid) return res.status(401).json({ error: 'Invalid access key' });

        const reservation = accessKeyService.getReservationForKey(key);
        if (!reservation) return res.status(400).json({ error: 'No active reservation found for this key' });

        const session = await paymentService.createCheckoutSession(key, reservation);
        res.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Checkout Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/session-status', async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

        const status = await paymentService.getSessionStatus(session_id);
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stripe webhook (requires raw body for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
        const result = await paymentService.handleWebhook(req.body, sig);
        res.json(result);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

export default router;
