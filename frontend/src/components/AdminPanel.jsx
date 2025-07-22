import React from 'react';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

const AdminPanel = ({ reservations }) => {
  return (
    <div className="admin-panel">
     <h2>Guest Access Links</h2>
      <table className="keys-table">
        <thead>
          <tr>
            <th>Link</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.code}>
              <td>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.url}
                  </a>
                ) : (
                  r.code
                )}
              </td>
              <td>{formatDate(r.start)}</td>
              <td>{formatDate(r.end)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
