import React from 'react';

function SpaControls({ spaMode, jetPump, filterPump, onToggle }) {
  const state = { spaMode, jetPump, filterPump };

  return (
    <div className="card">
      <h2>🛠️ Controls</h2>
      <div className="ctrl-grid">
        <button
          className={`ctrl-btn ${spaMode ? 'active danger' : ''}`}
          onClick={() => onToggle('spa')}>
          🛁 <span className="label">Spa</span>
        </button>
        <button
          className={`ctrl-btn ${jetPump ? 'active' : ''}`}
          onClick={() => onToggle('jet-pump')}>
          💨 <span className="label">Jet</span>
        </button>
        <button
          className={`ctrl-btn ${filterPump ? 'active' : ''}`}
          onClick={() => onToggle('filter-pump')}>
          🌊 <span className="label">Filter</span>
        </button>
      </div>
      <ol
        className="label"
        style={{ marginTop: '.8rem', textAlign: 'left', paddingLeft: '1.2rem' }}
      >
        <li>Wait for the status indicator above to turn green.</li>
        <li>
          Toggle the Jet and Spa buttons in any order, allowing a few seconds
          between actions.
        </li>
        <li>Remember to turn equipment off.</li>
      </ol>
    </div>
  );
}

export default SpaControls;
