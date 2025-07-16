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
      <p className="label" style={{ marginTop: '.8rem' }}>
        ⚠️ Jet status may lag after each press.
      </p>
    </div>
  );
}

export default SpaControls;
