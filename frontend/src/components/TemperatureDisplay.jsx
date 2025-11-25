import React from 'react';

function TempCard({ icon, label, value }) {
  return (
    <div className="card temp-card">
      <h2>{icon} {label}</h2>
      <div className="stat highlight">{value ?? '--'}°F</div>
      <p className="muted">Live sensor reading</p>
    </div>
  );
}

function TemperatureDisplay({ airTemp, spaTemp, poolTemp }) {
  return (
    <div className="temperature-display">
      <div className="ctrl-grid">
        <TempCard icon="🌤️" label="Air" value={airTemp} />
        <TempCard icon="🛁" label="Spa" value={spaTemp} />
        <TempCard icon="🏊" label="Pool" value={poolTemp} />
      </div>
    </div>
  );
}

export default TemperatureDisplay;
