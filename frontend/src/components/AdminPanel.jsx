import React, { useState } from 'react';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

import { clearPayment } from '../services/spaAPI';

const AdminPanel = ({ currentGuest, sharedStatus, onRefresh }) => {
  const [copiedCode, setCopiedCode] = useState(null);
  const [resetting, setResetting] = useState(false);

  const handleCopy = (url, code) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReset = async (code) => {
    if (!window.confirm(`Are you sure you want to clear the payment status for ${code}?`)) return;
    setResetting(true);
    try {
      await clearPayment(code);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to reset payment:', err);
      alert('Failed to reset payment status.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="gradient" aria-hidden></div>
      <div className="app admin-view">
        <header className="compact-hero card">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Current Access Status</h1>
          </div>
          <div className="badge-row tight">
            <span className="pill pill-info">Active Mode</span>
          </div>
        </header>

        <main className="app-main">
          <div className="surface-grid">
            {/* Shared Guest Link Card */}
            <div className="card glass-card">
              <div className="status-chips">
                <span className={`pill ${sharedStatus?.isPaid ? 'pill-success' : 'pill-ghost'}`}>
                  {sharedStatus?.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <p className="eyebrow">Master Shared Link</p>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.4rem' }}>katmaiguest</h3>
                <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  The permanent link for all non-Airbnb guests.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className={`btn-primary ${copiedCode === 'katmaiguest' ? 'copied' : ''}`}
                    onClick={() => handleCopy(sharedStatus?.url, 'katmaiguest')}
                    style={{ flex: 1, background: copiedCode === 'katmaiguest' ? 'var(--success)' : '' }}
                  >
                    {copiedCode === 'katmaiguest' ? 'URL Copied!' : 'Copy Master Link'}
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => handleReset('katmaiguest')}
                    disabled={resetting || !sharedStatus?.isPaid}
                    title="Clear payment status"
                    style={{ padding: '0.6rem 0.8rem' }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Current Active Guest Card */}
            {currentGuest ? (
              <div className="card glass-card">
                <div className="status-chips">
                  <span className={`pill ${currentGuest.isPaid ? 'pill-success' : 'pill-danger'}`}>
                    {currentGuest.isPaid ? 'Paid' : 'Payment Required'}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <p className="eyebrow">Current Airbnb Guest</p>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.4rem' }}>{currentGuest.code}</h3>
                  <div className="stat-block" style={{ marginTop: '1rem' }}>
                    <p className="small-label">Stay Duration</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {formatDate(currentGuest.start)} – {formatDate(currentGuest.end)}
                    </p>
                    <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>({currentGuest.nights} nights)</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={`btn-action ${copiedCode === currentGuest.code ? 'copied' : ''}`}
                        onClick={() => handleCopy(currentGuest.url, currentGuest.code)}
                        style={{ flex: 1 }}
                      >
                        {copiedCode === currentGuest.code ? 'URL Copied!' : 'Copy Link'}
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => handleReset(currentGuest.code)}
                        disabled={resetting || !currentGuest.isPaid}
                        title="Clear payment status"
                        style={{ padding: '0.6rem 0.8rem' }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card glass-card">
                <p className="eyebrow">Current Airbnb Guest</p>
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  No active Airbnb reservation found for today.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
