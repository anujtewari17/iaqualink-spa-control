import React from 'react';

function SpaControls({
  spaMode,
  spaTemp,
  jetPump,
  filterPump,
  connected,
  locationLabel,
  onToggle,
  disabled
}) {
  const spaButtonClasses = ['ctrl-btn', 'spa-btn'];
  if (spaMode) {
    spaButtonClasses.push('active');
    if (typeof spaTemp === 'number' && spaTemp < 100) {
      spaButtonClasses.push('danger');
    }
  }

  const spaLabel = typeof spaTemp === 'number' ? `${spaTemp}°F live` : 'Live temp --°F';

  return (
    <div className="card control-card compact-card">
      <div className="control-header">
        <div>
          <p className="eyebrow">Spa</p>
          <h2>Fast controls</h2>
        </div>
        <div className="status-chips">
          <span className={`pill ${connected ? 'pill-success' : 'pill-danger'}`}>
            {connected ? 'Connected' : 'Offline'}
          </span>
          <span className="pill pill-ghost">{locationLabel}</span>
        </div>
      </div>
      <div className="ctrl-grid">
        <button
          className={spaButtonClasses.join(' ')}
          onClick={() => onToggle('spa')}
          disabled={disabled}
        >
          <span className="spa-label">🛁 Spa</span>
          <span className="spa-temp">{spaLabel}</span>
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
    </div>
  );
}

export default SpaControls;
