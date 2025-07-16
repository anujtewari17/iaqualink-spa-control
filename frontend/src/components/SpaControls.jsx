import React from 'react';

function SpaControls({ spaMode, spaHeater, jetPump, filterPump, onToggle, disabled }) {
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
          className={`control-button ${spaActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('spa')}
          disabled={disabled}
        >
          <div className="control-icon">🛁</div>
          <div className="control-label">Spa</div>
          <div className="control-status">
            {spaActive ? 'ON' : 'OFF'}
          </div>
        </button>

        <button
          className={`control-button ${jetPump ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('jet-pump')}
          disabled={disabled}
        >
          <div className="control-icon">💨</div>
          <div className="control-label">Jet Pump</div>
          <div className="control-status">
            {jetPump ? 'ON' : 'OFF'}
          </div>
        </button>

        <button
          className={`control-button ${filterPump ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => handleButtonClick('filter-pump')}
          disabled={disabled}
        >
          <div className="control-icon">🌊</div>
          <div className="control-label">Filter Pump</div>
          <div className="control-status">
            {filterPump ? 'ON' : 'OFF'}
          </div>
        </button>
      </div>

      <div className="control-note">
        <p>🔔 Spa must be ON to use jets</p>
        <p>⚠️ <strong>Jet Pump Note:</strong> Status may not update immediately after pressing button due to system limitations</p>
        <p>⏱️ Updates appear within a few seconds</p>
        <p>🔄 Filter pump will automatically turn off when spa is turned off</p>
      </div>
    </div>
  );
}

export default SpaControls;
