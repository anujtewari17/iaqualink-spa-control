import React, { useState } from 'react';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const AdminPanel = ({ currentGuest, sharedStatus }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (url, code) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
                <button
                  className={`btn-primary ${copiedCode === 'katmaiguest' ? 'copied' : ''}`}
                  onClick={() => handleCopy(sharedStatus?.url, 'katmaiguest')}
                  style={{ width: '100%', background: copiedCode === 'katmaiguest' ? 'var(--success)' : '' }}
                >
                  {copiedCode === 'katmaiguest' ? 'URL Copied!' : 'Copy Master Link'}
                </button>
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
                    <p className="muted" style={{ fontSize: '0.85rem' }}>({currentGuest.nights} nights)</p>
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
