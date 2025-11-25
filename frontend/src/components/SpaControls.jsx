import React from 'react';

function SpaControls({ spaMode, spaTemp, jetPump, filterPump, onToggle, disabled }) {
  const spaButtonClasses = ['ctrl-btn'];
  if (spaMode) {
    spaButtonClasses.push('active');
    if (typeof spaTemp === 'number' && spaTemp < 100) {
      spaButtonClasses.push('danger');
    }
  }

  return (
    <div className="card control-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Equipment</p>
          <h2>🛠️ Controls</h2>
        </div>
        <p className="muted">Toggle spa mode, jets, and filtration. Commands send instantly.</p>
      </div>
      <div className="ctrl-grid">
        <button
          className={spaButtonClasses.join(' ')}
          onClick={() => onToggle('spa')}
          disabled={disabled}
        >
          🛁 <span className="label">Spa</span>
        </button>
        <button
          className={`ctrl-btn ${jetPump ? 'active' : ''}`}
          onClick={() => onToggle('jet-pump')}
          disabled={disabled}
        >
          💨 <span className="label">Jet</span>
        </button>
        <button
          className={`ctrl-btn ${filterPump ? 'active' : ''}`}
          onClick={() => onToggle('filter-pump')}
          disabled={disabled}
        >
          🌊 <span className="label">Filter</span>
        </button>
      </div>
      <ol
        className="label"
        style={{ marginTop: '.8rem', textAlign: 'left', paddingLeft: '1.2rem' }}
      >
        <li>Confirm the connection pill above is green before sending commands.</li>
        <li>Use short taps and allow a few seconds between actions.</li>
        <li>Turn equipment off when you leave the spa.</li>
      </ol>
    </div>
  );
}

export default SpaControls;
