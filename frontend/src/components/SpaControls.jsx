import React from 'react';

function SpaControls({ spaMode, spaHeater, jetPump, onToggle, disabled }) {
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
          className={`control-button ${spaMode ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('spa-mode')}
          disabled={disabled}
        >
          <div className="control-icon">🛁</div>
          <div className="control-label">Spa Mode</div>
          <div className="control-status">{spaMode ? 'ON' : 'OFF'}</div>
        </button>

        <button 
          className={`control-button ${spaHeater ? 'active heating' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('spa-heater')}
          disabled={disabled}
        >
          <div className="control-icon">🔥</div>
          <div className="control-label">Spa Heater</div>
          <div className="control-status">
            {spaHeater ? 'HEATING' : 'OFF'}
          </div>
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
        <p>🔔 Spa Mode must be ON to use heater and jets</p>
        <p>⏱️ Changes may take 30-60 seconds to take effect</p>
      </div>
    </div>
  );
}

export default SpaControls;
