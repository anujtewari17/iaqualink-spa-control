import React, { useState, useEffect } from 'react';
import TemperatureDisplay from './components/TemperatureDisplay';
import SpaControls from './components/SpaControls';
import ConnectionStatus from './components/ConnectionStatus';
import { getSpaStatus, toggleSpaDevice } from './services/spaAPI';

function App() {
  const [spaData, setSpaData] = useState({
    airTemp: '--',
    spaTemp: '--',
    poolTemp: '--',
    spaMode: false,
    spaHeater: false,
    jetPump: false,
    connected: false,
    lastUpdate: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpaStatus = async () => {
    try {
      const status = await getSpaStatus();
      setSpaData(prev => ({
        ...prev,
        airTemp: status.airTemp || '--',
        spaTemp: status.spaTemp || '--',
        poolTemp: status.poolTemp || '--',
        spaMode: status.spaMode || false,
        spaHeater: status.spaHeater || false,
        jetPump: status.jetPump || false,
        connected: true,
        lastUpdate: new Date()
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch spa status:', err);
      setError('Connection failed');
      setSpaData(prev => ({ ...prev, connected: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (device) => {
    try {
      setLoading(true);
      await toggleSpaDevice(device);
      // Refresh status after toggle
      await fetchSpaStatus();
    } catch (err) {
      console.error(`Failed to toggle ${device}:`, err);
      setError(`Failed to toggle ${device}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaStatus();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSpaStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !spaData.lastUpdate) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to spa system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌊 Spa Control</h1>
        <p>Guest Access Panel</p>
      </header>

      <ConnectionStatus 
        connected={spaData.connected} 
        lastUpdate={spaData.lastUpdate}
        error={error}
      />

      <main className="app-main">
        <TemperatureDisplay 
          airTemp={spaData.airTemp}
          spaTemp={spaData.spaTemp}
          poolTemp={spaData.poolTemp}
        />

        <SpaControls 
          spaMode={spaData.spaMode}
          spaHeater={spaData.spaHeater}
          jetPump={spaData.jetPump}
          onToggle={handleToggle}
          disabled={loading || !spaData.connected}
        />
      </main>

      <footer className="app-footer">
        <p>Touch controls to operate spa features</p>
        <p>System updates every 30 seconds</p>
      </footer>
    </div>
  );
}

export default App;
