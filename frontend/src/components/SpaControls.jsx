import React from 'react';

function SpaControls({
  spaMode,
  spaTemp,
  jetPump,
  filterPump,
  connected,
  commandMessage,
  commandActive,
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

  const spaLabel = spaMode
    ? typeof spaTemp === 'number'
      ? `${spaTemp}°F live`
      : 'Reading...'
    : 'System Off';

  return (
    <div className="card control-card compact-card">
      <div className="control-header">
        <div>
          <p className="eyebrow">Main controls</p>
          <h2>Spa & Jets</h2>
        </div>
        <div className="status-chips">
          <span className={`pill ${connected ? 'pill-success' : 'pill-danger'}`}>
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
      
      {commandMessage && (
        <div className="muted" role="status" style={{ marginBottom: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
          {commandMessage}
        </div>
      )}

      <div className="ctrl-grid">
        <button
          className={spaButtonClasses.join(' ')}
          onClick={() => onToggle('spa')}
          disabled={disabled}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
            <span className="spa-label">🛁 Master Toggle</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Mode & Heater</span>
          </div>
          <span className="spa-temp">{spaLabel}</span>
        </button>

        <button
          className={`ctrl-btn ${jetPump ? 'active' : ''}`}
          onClick={() => onToggle('jet-pump')}
          disabled={disabled || commandActive}
        >
          <span style={{ fontSize: '1.8rem' }}>💨</span>
          <span className="label">Jets</span>
        </button>

        <button
          className={`ctrl-btn ${filterPump ? 'active' : ''}`}
          onClick={() => onToggle('filter-pump')}
          disabled={disabled || commandActive}
        >
          <span style={{ fontSize: '1.8rem' }}>🌊</span>
          <span className="label">Filter</span>
        </button>
      </div>
    </div>
  );
}

export default SpaControls;
