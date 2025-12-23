import express from 'express';
import paymentService from '../services/paymentService.js';
import accessKeyService from '../services/accessKeyService.js';

const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        const { accessKey, nights } = req.body; // Extract accessKey and nights from request body
        if (!accessKey) return res.status(400).json({ error: 'Missing accessKey in request body' });

        const isValid = await accessKeyService.validateKey(accessKey);
        if (!isValid) return res.status(401).json({ error: 'Invalid access key' });

        const reservation = accessKeyService.getReservationForKey(accessKey);
        if (!reservation) return res.status(400).json({ error: 'No active reservation found for this key' });

        // Pass accessKey, reservation, and nights to the payment service
        const session = await paymentService.createCheckoutSession(accessKey, reservation, nights || 1);
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

        const session = await paymentService.getSessionStatus(session_id);

        // If payment is complete, ensure it's recorded in our local DB
        // This acts as a fallback for webhooks
        if (session.status === 'complete' && session.payment_status === 'paid') {
            const { accessKey, nights } = session.metadata;
            if (accessKey) {
                console.log(`Manual status check confirmed payment for key: ${accessKey}`);
                const paidAccessService = (await import('../services/paidAccessService.js')).default;
                paidAccessService.addPayment(accessKey, session.amount_total, nights, session_id);
            }
        }

        res.json(session);
    } catch (err) {
        console.error('Session Status Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Administrative: Clear payments for a key
router.post('/clear-payment', async (req, res) => {
    try {
        const key = req.headers['x-access-key'];
        if (key !== process.env.ACCESS_KEY) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { targetKey } = req.body;
        if (!targetKey) return res.status(400).json({ error: 'Missing targetKey' });

        console.log(`[Admin] Reset request received for key: ${targetKey}`);
        const paidAccessService = (await import('../services/paidAccessService.js')).default;
        paidAccessService.clearPayments(targetKey);

        console.log(`[Admin] Successfully cleared payments for: ${targetKey}`);
        res.json({ success: true, message: `Payments cleared for ${targetKey}` });
    } catch (err) {
        console.error('Clear Payment Error:', err);
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
