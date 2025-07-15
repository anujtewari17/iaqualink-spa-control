import React from 'react';

function ConnectionStatus({ connected, lastUpdate, error }) {
  const getStatusColor = () => {
    if (error) return '#ff6b6b';
    if (connected) return '#51cf66';
    return '#ffd43b';
  };

  const getStatusText = () => {
    if (error) return error;
    if (connected) return 'Connected';
    return 'Connecting...';
  };

  const formatLastUpdate = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString();
  };

  return (
    <div className="connection-status">
      <div className="status-indicator">
        <div 
          className="status-dot"
          style={{ backgroundColor: getStatusColor() }}
        ></div>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {formatLastUpdate(lastUpdate)}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
