import React, { useState } from 'react';
import { clearSpaSession } from '../services/spaAPI';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const AdminPanel = ({ guestStatus, onRefresh }) => {
  const [clearing, setClearing] = useState(false);

  const handleClearSession = async () => {
    if (!window.confirm("Are you sure you want to end the active guest session early?")) return;
    setClearing(true);
    try {
      await clearSpaSession();
      alert("Session ended successfully.");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to clear session:", err);
      alert("Failed to end the session.");
    } finally {
      setClearing(false);
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

  const handleLogout = () => {
    localStorage.removeItem('accessKey');
    window.location.href = '/';
  };

  return (
    <div className="app-shell">
      <div className="gradient" aria-hidden></div>
      <div className="app">
        <header className="compact-hero card" style={{ position: 'relative' }}>
          <button 
            className="btn-action" 
            onClick={handleLogout}
            style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}
          >
            Logout
          </button>
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Guest Access Status</h1>
          </div>
        </header>

        <main className="app-main">
          <div className="card glass-card" style={{ padding: '2rem' }}>
            <div className="status-chips">
              <span className={`pill pill-success`}>
                Admin Mode Active
              </span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="stat-block">
                <p className="small-label">
                  Guest Session Status
                </p>
                <h2 style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>
                  {guestStatus?.active ? 'Active Session' : 'Idle / No active session'}
                </h2>
                {guestStatus?.active && guestStatus.endTime && (
                  <p className="muted" style={{ fontSize: '1rem' }}>
                    Session expires at: {formatExpiry(guestStatus.endTime)}
                  </p>
                )}
              </div>

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  The guest session system is now fully automated. Guests select up to 3 hours of access, and the system auto-locks when time expires.
                </p>
                <button
                    className="btn-action"
                    onClick={() => { if (onRefresh) onRefresh() }}
                    style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', marginBottom: '1rem' }}
                  >
                    Refresh Status
                </button>
                {guestStatus?.active && (
                  <button
                      className="btn-action"
                      onClick={handleClearSession}
                      disabled={clearing}
                      style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d' }}
                    >
                      {clearing ? 'Ending Session...' : 'End Guest Session Early'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
