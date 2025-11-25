import React from 'react';

function TempCard({ icon, label, value }) {
  return (
    <div className="card">
      <h2>{icon} {label}</h2>
      <div className="stat">{value ?? '--'}°F</div>
    </div>
  );
}

function formatEta(heatEstimate, targetTemp) {
  if (!heatEstimate) return 'Estimating…';
  if (heatEstimate.ready) return `Spa reached ${targetTemp}°F`;

  const minutes = Math.round(heatEstimate.etaMinutes);
  const timeString = heatEstimate.etaTimestamp.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });

  return `~${minutes} min (about ${timeString})`;
}

function TemperatureDisplay({ airTemp, spaTemp, poolTemp, heatEstimate, targetTemp = 100 }) {
  return (
    <div className="temperature-display">
      <div className="ctrl-grid">
        <TempCard icon="🌤️" label="Air" value={airTemp} />
        <TempCard icon="🛁" label="Spa" value={spaTemp} />
        <TempCard icon="🏊" label="Pool" value={poolTemp} />
      </div>
      <div className="card eta-card">
        <div className="eta-icon" aria-hidden>⏱️</div>
        <div className="eta-copy">
          <p className="label">Heat ETA</p>
          <div className="eta-stat">{formatEta(heatEstimate, targetTemp)}</div>
          <p className="eta-target">Target {targetTemp}°F</p>
        </div>
      </div>
    </div>
  );
}

export default TemperatureDisplay;
