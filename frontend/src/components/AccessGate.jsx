import React, { useState } from 'react';
import { startSpaSession } from '../services/spaAPI';

const AccessGate = ({ onUnlocked }) => {
    const [hours, setHours] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleHoursChange = (delta) => {
        setHours(prev => Math.max(1, Math.min(3, prev + delta)));
    };

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);
        try {
            await startSpaSession(hours);
            onUnlocked();
        } catch (err) {
            console.error('Failed to start session:', err);
            setError('Could not start session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell">
            <div className="gradient" aria-hidden></div>
            <div className="app">
                <header className="compact-hero card">
                    <div>
                        <p className="eyebrow">Access Required</p>
                        <h1>Turn On Spa</h1>
                    </div>
                </header>

                <main className="app-main">
                    <div className="card status-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div className="status-value" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
                            🌊
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Welcome!</h2>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                            Select how many hours you would like to turn on the spa for.
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
                            <p className="eyebrow" style={{ fontSize: '0.75rem' }}>Select number of hours</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <button
                                    className="pill pill-ghost"
                                    onClick={() => handleHoursChange(-1)}
                                    disabled={hours <= 1 || loading}
                                    style={{ fontSize: '1.5rem', width: '45px', height: '45px', justifyContent: 'center', cursor: 'pointer', opacity: hours <= 1 ? 0.3 : 1 }}
                                >
                                    −
                                </button>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '700', display: 'block' }}>{hours}</span>
                                    <span className="label" style={{ fontSize: '0.9rem' }}>{hours === 1 ? 'HOUR' : 'HOURS'}</span>
                                </div>
                                <button
                                    className="pill pill-ghost"
                                    onClick={() => handleHoursChange(1)}
                                    disabled={hours >= 3 || loading}
                                    style={{ fontSize: '1.5rem', width: '45px', height: '45px', justifyContent: 'center', cursor: 'pointer', opacity: hours >= 3 ? 0.3 : 1 }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p style={{ color: '#ff4d4d', marginBottom: '1.5rem' }}>{error}</p>
                        )}

                        <button
                            className="btn-primary"
                            onClick={handleUnlock}
                            disabled={loading}
                            style={{ width: '100%', maxWidth: '340px' }}
                        >
                            {loading ? 'Starting...' : `Turn On for ${hours} ${hours === 1 ? 'Hour' : 'Hours'}`}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AccessGate;
