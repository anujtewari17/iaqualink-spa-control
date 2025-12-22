import React, { useState } from 'react';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const AdminPanel = ({ reservations = [] }) => {
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
            <p className="eyebrow">Admin Panel</p>
            <h1>Reservation History</h1>
          </div>
          <div className="badge-row tight">
            <span className="pill pill-info">Total Reservations: {reservations.length}</span>
          </div>
        </header>

        <main className="app-main">
          <div className="card glass-card admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest Details</th>
                    <th>Stay Dates</th>
                    <th>Nights</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No reservations found in the system.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r) => (
                      <tr key={r.code}>
                        <td data-label="Guest">
                          <div className="guest-info">
                            <span className="guest-name">{r.guestName}</span>
                            <span className="guest-code">{r.code}</span>
                          </div>
                        </td>
                        <td data-label="Dates">
                          <div className="date-range">
                            {formatDate(r.start)} – {formatDate(r.end)}
                          </div>
                        </td>
                        <td data-label="Nights">{r.nights}</td>
                        <td data-label="Amount">${r.totalPrice?.toFixed(2)}</td>
                        <td data-label="Status">
                          <span className={`status-pill ${r.isPaid ? 'paid' : 'unpaid'}`}>
                            {r.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className={`btn-action ${copiedCode === r.code ? 'copied' : ''}`}
                            onClick={() => handleCopy(r.url, r.code)}
                          >
                            {copiedCode === r.code ? 'Copied!' : 'Copy Link'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
