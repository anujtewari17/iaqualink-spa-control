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

const AdminPanel = ({ guestStatus, monthlyStats, sessionHistory = [], onRefresh }) => {
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

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              <div className="stat-block">
                <p className="small-label">
                  Guest Session Status
                </p>
                <h2 style={{ fontSize: '1.6rem', margin: '0.5rem 0' }}>
                  {guestStatus?.active ? 'Active' : 'Idle'}
                </h2>
                {guestStatus?.active && guestStatus.endTime ? (
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    Expires: {formatExpiry(guestStatus.endTime)}
                  </p>
                ) : (
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    Waiting for guest
                  </p>
                )}
              </div>

              {monthlyStats && (
                <div className="stat-block">
                  <p className="small-label">
                    Usage this Month ({monthlyStats.monthName})
                  </p>
                  <h2 style={{ fontSize: '1.6rem', margin: '0.5rem 0' }}>
                    {monthlyStats.totalHours} <span style={{ fontSize: '1rem', opacity: 0.7 }}>Hours</span>
                  </h2>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    {monthlyStats.sessionCount} total sessions
                  </p>
                </div>
              )}
            </div>

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  The guest session system is now fully automated. Guests select up to 3 hours of access, and the system auto-locks when time expires.
                </p>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
                <button
                    className="btn-action"
                    onClick={() => { if (onRefresh) onRefresh() }}
                    style={{ flex: 1, justifyContent: 'center', background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                  >
                    Refresh Dashboard
                </button>
                {guestStatus?.active && (
                  <button
                      className="btn-action"
                      onClick={handleClearSession}
                      disabled={clearing}
                      style={{ flex: 1, justifyContent: 'center', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d' }}
                    >
                      {clearing ? 'Ending Session...' : 'End Session Early'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Log Card */}
          <div className="card glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Recent Session History (60 Days)
            </h2>
            
            {!sessionHistory || sessionHistory.length === 0 ? (
              <p className="muted" style={{ fontSize: '1rem', padding: '1rem 0' }}>No recent usage history recorded.</p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Time Range</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600', textAlign: 'right' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((session, idx) => {
                      const startDate = new Date(session.start);
                      const endDate = session.end ? new Date(session.end) : null;
                      
                      const dateStr = startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      
                      const startTimeStr = startDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      const endTimeStr = endDate ? endDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Running';
                      
                      const isCapped = session.durationMinutes >= 240;
                      const durationStr = session.durationMinutes >= 60 
                        ? `${(session.durationMinutes / 60).toFixed(1)} hrs`
                        : `${session.durationMinutes} mins`;

                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{dateStr}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                            {startTimeStr} – {endTimeStr}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>
                            <span 
                              style={{ 
                                color: isCapped ? 'var(--warning)' : 'var(--text)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title={isCapped ? "Capped at 4-hour max safety limit" : ""}
                            >
                              {durationStr}
                              {isCapped && <span style={{ fontSize: '0.8rem' }}>⚠️</span>}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
