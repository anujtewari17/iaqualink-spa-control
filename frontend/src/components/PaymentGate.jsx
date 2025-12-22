import React, { useState, useCallback, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { createCheckoutSession } from '../services/spaAPI';

// Initialize Stripe outside of component
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
if (!publishableKey) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is not defined in the environment.');
}

const PaymentGate = ({ message }) => {
    const [showCheckout, setShowCheckout] = useState(false);
    const [error, setError] = useState(null);

    const fetchClientSecret = useCallback(async () => {
        try {
            const { clientSecret } = await createCheckoutSession();
            return clientSecret;
        } catch (err) {
            console.error('Payment Error:', err);
            setError('Could not start payment. Please try again or contact support.');
            throw err;
        }
    }, []);

    const options = React.useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

    if (showCheckout) {
        return (
            <div className="app-shell">
                <div className="gradient" aria-hidden></div>
                <div className="app">
                    <header className="compact-hero card">
                        <button
                            className="pill pill-ghost"
                            onClick={() => setShowCheckout(false)}
                            style={{ marginBottom: '1rem', cursor: 'pointer' }}
                        >
                            ← Back
                        </button>
                        <div>
                            <p className="eyebrow">Secure Checkout</p>
                            <h1>Payment</h1>
                        </div>
                    </header>
                    <main className="app-main">
                        <div className="card" style={{ padding: '1rem' }}>
                            <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={options}
                            >
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <div className="gradient" aria-hidden></div>
            <div className="app">
                <header className="compact-hero card">
                    <div>
                        <p className="eyebrow">Access Required</p>
                        <h1>Unlock Spa Controls</h1>
                    </div>
                </header>

                <main className="app-main">
                    <div className="card status-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="status-value" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            🌊
                        </div>
                        <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.9 }}>
                            {message || 'Access to spa controls requires a one-time payment for your stay.'}
                        </p>
                        <div className="temp-display" style={{ marginBottom: '2rem' }}>
                            <span className="temp-value">$25</span>
                            <span className="temp-unit">/night</span>
                        </div>

                        {error && (
                            <p style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{error}</p>
                        )}

                        <button
                            className="control-button primary"
                            onClick={() => setShowCheckout(true)}
                            style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
                        >
                            Unlock Features
                        </button>
                        <p className="eyebrow" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
                            Secure payment via Stripe. Features unlock instantly after payment.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PaymentGate;
