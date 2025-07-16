import React from 'react';

function TemperatureDisplay({ airTemp, spaTemp, poolTemp, spaSetPoint, onTemperatureChange, disabled }) {
  const handleTempChange = (e) => {
    const newTemp = parseInt(e.target.value);
    if (newTemp >= 80 && newTemp <= 104) {
      onTemperatureChange(newTemp);
    }
  };

  return (
    <div className="temperature-display">
      <h2>🌡️ Temperature Monitor</h2>
      
      <div className="temp-grid">
        <div className="temp-card">
          <div className="temp-icon">🌤️</div>
          <div className="temp-label">Air</div>
          <div className="temp-value">
            {airTemp ? `${airTemp}°F` : '--°F'}
          </div>
        </div>
        
        <div className="temp-card">
          <div className="temp-icon">🛁</div>
          <div className="temp-label">Spa</div>
          <div className="temp-value">
            {spaTemp ? `${spaTemp}°F` : '--°F'}
          </div>
        </div>
        
        <div className="temp-card">
          <div className="temp-icon">🏊</div>
          <div className="temp-label">Pool</div>
          <div className="temp-value">
            {poolTemp ? `${poolTemp}°F` : '--°F'}
          </div>
        </div>
      </div>

      <div className="spa-temp-control">
        <label htmlFor="spa-temp-slider">🎯 Spa Target Temperature</label>
        <div className="temp-slider-container">
          <input
            id="spa-temp-slider"
            type="range"
            min="80"
            max="104"
            value={spaSetPoint || 100}
            onChange={handleTempChange}
            disabled={disabled}
            className="temp-slider"
          />
          <div className="temp-slider-value">
            {spaSetPoint || 100}°F
          </div>
        </div>
        <div className="temp-range-label">
          <span>80°F</span>
          <span>104°F</span>
        </div>
      </div>
    </div>
  );
}

export default TemperatureDisplay;
