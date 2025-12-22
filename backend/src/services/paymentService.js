import Stripe from 'stripe';
import dotenv from 'dotenv';
import paidAccessService from './paidAccessService.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    async createCheckoutSession(accessKey, reservation) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }

        let frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!/^https?:\/\//i.test(frontendBase)) {
            frontendBase = `https://${frontendBase}`;
        }
        frontendBase = frontendBase.replace(/\/?$/, '');

        // Calculate nights
        const start = new Date(reservation.start);
        const end = new Date(reservation.end);
        const diffTime = Math.abs(end - start);
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Minimum 1 night
        const count = Math.max(nights, 1);
        const totalPrice = count * 2500; // $25.00 in cents

        console.log('Creating checkout session for:', { accessKey, reservation, frontendBase });

        try {
            const stripeOptions = {};
            if (process.env.STRIPE_ACCOUNT_ID) {
                stripeOptions.stripeAccount = process.env.STRIPE_ACCOUNT_ID;
            }

            const session = await stripe.checkout.sessions.create({
                ui_mode: 'embedded',
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Spa Access',
                                description: `Access to spa controls for ${count} nights`,
                            },
                            unit_amount: totalPrice,
                        },
                        quantity: 1,
                    },
                ],
                return_url: `${frontendBase}/?session_id={CHECKOUT_SESSION_ID}&key=${accessKey}`,
                metadata: {
                    accessKey,
                    nights: count
                },
            }, stripeOptions);
            console.log('Checkout session created successfully');
            return session;
        } catch (stripeError) {
            console.error('Stripe SDK Error:', stripeError);
            throw stripeError;
        }
    }

    async getSessionStatus(sessionId) {
        const stripeOptions = {};
        if (process.env.STRIPE_ACCOUNT_ID) {
            stripeOptions.stripeAccount = process.env.STRIPE_ACCOUNT_ID;
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId, stripeOptions);
        return {
            status: session.status,
            customer_email: session.customer_details.email,
            payment_status: session.payment_status
        };
    }

    async handleWebhook(body, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            throw err;
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { accessKey, nights } = session.metadata;

            console.log(`Payment confirmed for key: ${accessKey}`);
            paidAccessService.addPayment(accessKey, session.amount_total, nights, session.id);
        }

        return { received: true };
    }
}

export default new PaymentService();
