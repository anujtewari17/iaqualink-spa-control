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

const AdminPanel = ({ guestStatus, onRefresh }) => {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    const codeToReset = guestStatus?.code || 'katmaiguest';
    console.log(`[AdminUI] Initiating reset for: ${codeToReset}`);
    if (!window.confirm(`Are you sure you want to clear the payment status for ${codeToReset}?`)) return;
    setResetting(true);
    try {
      console.log(`[AdminUI] Sending clearPayment request...`);
      await clearPayment(codeToReset);
      await clearPayment('katmaiguest'); // Clean up both just in case
      console.log(`[AdminUI] Reset successful, refreshing status...`);
      if (onRefresh) await onRefresh();
      alert(`Success: Payment status for ${codeToReset} has been reset.`);
    } catch (err) {
      console.error('[AdminUI] Reset failed:', err);
      alert('Failed to reset payment status.');
    } finally {
      setResetting(false);
    }
  };

  const formatExpiry = (iso) => {
    if (!iso) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(iso));
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const options = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', options)} – ${e.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="app-shell">
      <div className="gradient" aria-hidden></div>
      <div className="app">
        <header className="compact-hero card">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Guest Access Status</h1>
          </div>
        </header>

        <main className="app-main">
          <div className="card glass-card" style={{ padding: '2rem' }}>
            <div className="status-chips">
              <span className={`pill ${guestStatus?.isPaid ? 'pill-success' : 'pill-danger'}`}>
                {guestStatus?.isPaid ? 'Paid & Unlocked' : 'Payment Required'}
              </span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="stat-block">
                <p className="small-label">
                  {guestStatus?.start ? 'Current Reservation' : 'Session Status'}
                </p>
                <h2 style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
                  {guestStatus?.start ? formatDateRange(guestStatus.start, guestStatus.end) : 'Idle / No active reservation'}
                </h2>
                {guestStatus?.isPaid && (
                  <p className="muted" style={{ fontSize: '1rem' }}>
                    {guestStatus.nights} night stay confirmed.
                  </p>
                )}
              </div>

              {guestStatus?.isPaid && (
                <div className="stat-block" style={{ marginTop: '1.5rem' }}>
                  <p className="small-label">Access Duration</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--success)' }}>
                    ✅ Unlocked for Full Trip
                  </p>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Access remains active as long as the current guest is in session.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Clear the current payment if a guest leaves early or to reset for a new arrival.
                </p>
                <button
                  className="btn-action"
                  onClick={handleReset}
                  disabled={resetting}
                  style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d' }}
                >
                  {resetting ? 'Resetting...' : 'Reset Payment Status'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
