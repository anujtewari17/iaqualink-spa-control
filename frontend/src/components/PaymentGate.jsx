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
    const [nights, setNights] = useState(3);
    const [error, setError] = useState(null);

    const fetchClientSecret = useCallback(async () => {
        try {
            const { clientSecret } = await createCheckoutSession(nights);
            return clientSecret;
        } catch (err) {
            console.error('Payment Error:', err);
            setError('Could not start payment. Please try again or contact support.');
            throw err;
        }
    }, [nights]);

    const options = React.useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

    const handleNightsChange = (delta) => {
        setNights(prev => Math.max(1, Math.min(14, prev + delta)));
    };

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
                    <div className="card status-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div className="status-value" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
                            🌊
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Welcome!</h2>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                            {message || 'Access to spa controls requires a one-time payment for your stay.'}
                        </p>

                        <div className="night-selector" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '2.5rem',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <p className="eyebrow" style={{ fontSize: '0.75rem' }}>Select number of nights</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <button
                                    className="pill pill-ghost"
                                    onClick={() => handleNightsChange(-1)}
                                    style={{ fontSize: '1.5rem', width: '45px', height: '45px', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    −
                                </button>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '700', display: 'block' }}>{nights}</span>
                                    <span className="label" style={{ fontSize: '0.9rem' }}>{nights === 1 ? 'NIGHT' : 'NIGHTS'}</span>
                                </div>
                                <button
                                    className="pill pill-ghost"
                                    onClick={() => handleNightsChange(1)}
                                    style={{ fontSize: '1.5rem', width: '45px', height: '45px', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    +
                                </button>
                            </div>
                            <div className="temp-display" style={{ marginTop: '0.5rem' }}>
                                <span className="temp-value" style={{ fontSize: '1.8rem' }}>${nights * 25}</span>
                                <span className="temp-unit" style={{ fontSize: '1rem' }}> TOTAL</span>
                            </div>
                        </div>

                        {error && (
                            <p style={{ color: '#ff4d4d', marginBottom: '1.5rem' }}>{error}</p>
                        )}

                        <button
                            className="btn-primary"
                            onClick={() => setShowCheckout(true)}
                            style={{ width: '100%', maxWidth: '340px' }}
                        >
                            Unlock Features for {nights} {nights === 1 ? 'Night' : 'Nights'}
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
