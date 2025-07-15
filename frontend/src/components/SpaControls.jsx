import React from 'react';

function SpaControls({ spaMode, spaHeater, jetPump, onToggle, disabled }) {
  const spaActive = spaMode || spaHeater;

  const handleButtonClick = (device) => {
    if (!disabled) {
      onToggle(device);
    }
  };

  return (
    <div className="spa-controls">
      <h2>Spa Controls</h2>

      <div className="control-grid">
        <button
          className={`control-button ${spaActive ? 'active heating' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('spa')}
          disabled={disabled}
        >
          <div className="control-icon">🛁</div>
          <div className="control-label">Spa</div>
          <div className="control-status">{spaActive ? 'ON' : 'OFF'}</div>
        </button>

        <button 
          className={`control-button ${jetPump ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('jet-pump')}
          disabled={disabled}
        >
          <div className="control-icon">💨</div>
          <div className="control-label">Jet Pump</div>
          <div className="control-status">{jetPump ? 'ON' : 'OFF'}</div>
        </button>
      </div>

      <div className="control-note">
        <p>🔔 Spa must be ON to use jets</p>
        <p>⏱️ Changes may take 30-60 seconds to take effect</p>
      </div>
    </div>
  );
}

export default SpaControls;
