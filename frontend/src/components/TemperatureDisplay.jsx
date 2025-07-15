import React from 'react';

function TemperatureDisplay({ airTemp, spaTemp, poolTemp }) {
  const formatTemp = (temp) => {
    if (temp === '--' || temp === null || temp === undefined) {
      return '--°F';
    }
    return `${temp}°F`;
  };

  return (
    <div className="temperature-display">
      <div className="temp-card">
        <div className="temp-icon">🌡️</div>
        <div className="temp-info">
          <div className="temp-value">{formatTemp(airTemp)}</div>
          <div className="temp-label">Air Temp</div>
        </div>
      </div>

      <div className="temp-card spa-temp">
        <div className="temp-icon">♨️</div>
        <div className="temp-info">
          <div className="temp-value">{formatTemp(spaTemp)}</div>
          <div className="temp-label">Spa Temp</div>
        </div>
      </div>

      <div className="temp-card">
        <div className="temp-icon">🏊</div>
        <div className="temp-info">
          <div className="temp-value">{formatTemp(poolTemp)}</div>
          <div className="temp-label">Pool Temp</div>
        </div>
      </div>
    </div>
  );
}

export default TemperatureDisplay;
