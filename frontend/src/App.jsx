import React, { useState, useEffect } from 'react';
import SpaControls from './components/SpaControls';
import TemperatureDisplay from './components/TemperatureDisplay';
import Login from './components/Login';
import { getSpaStatus, toggleSpaDevice, setSpaTemperature } from './services/spaAPI';

function App() {
  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem('accessKey')
  );
  const [spaData, setSpaData] = useState({
    spaMode: false,
    spaHeater: false,
    jetPump: false,
    filterPump: false,
    connected: false,
    airTemp: null,
    spaTemp: null,
    poolTemp: null,
    spaSetPoint: null,
    lastUpdate: null
  });

  const [loading, setLoading] = useState(true);

  const handleLogin = (key) => {
    localStorage.setItem('accessKey', key);
    setAuthenticated(true);
    fetchSpaStatus();
  };

  const fetchSpaStatus = async () => {
    if (!authenticated) return;
    try {
      const status = await getSpaStatus();
      console.log('SPA STATUS RESPONSE:', status);
      setSpaData(prev => ({
        ...prev,
        spaMode: !!status.spaMode,
        spaHeater: !!status.spaHeater,
        jetPump: !!status.jetPump,
        filterPump: !!status.filterPump,
        airTemp: status.airTemp,
        spaTemp: status.spaTemp,
        poolTemp: status.poolTemp,
        spaSetPoint: status.spaSetPoint,
        connected: true,
        lastUpdate: new Date()
      }));
    } catch (err) {
      console.error('Failed to fetch spa status:', err);
      setSpaData(prev => ({ ...prev, connected: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (device) => {
    if (!authenticated) return;
    const prevState = { ...spaData };

    const optimisticUpdate = (updates) =>
      setSpaData((p) => ({ ...p, ...updates, lastUpdate: new Date() }));

    try {
      setLoading(true);

      if (device === 'spa') {
        const newState = !spaData.spaMode;
        optimisticUpdate({ 
          spaMode: newState, 
          spaHeater: newState,
          // When spa turns off, also turn off filter pump
          filterPump: newState ? spaData.filterPump : false
        });
        await toggleSpaDevice('spa-mode');
        const res = await toggleSpaDevice('spa-heater');
        
        // If spa is being turned off, also turn off filter pump
        if (!newState && spaData.filterPump) {
          await toggleSpaDevice('filter-pump');
        }
        
        if (res.status) {
          optimisticUpdate({
            spaMode: !!res.status.spaMode,
            spaHeater: !!res.status.spaHeater,
            jetPump: !!res.status.jetPump,
            filterPump: !!res.status.filterPump,
          });
        }
      } else {
        const keyMap = { 
          'jet-pump': 'jetPump',
          'filter-pump': 'filterPump'
        };
        optimisticUpdate({ [keyMap[device]]: !spaData[keyMap[device]] });

        const res = await toggleSpaDevice(device);
        if (res.status) {
          optimisticUpdate({
            spaMode: !!res.status.spaMode,
            spaHeater: !!res.status.spaHeater,
            jetPump: !!res.status.jetPump,
            filterPump: !!res.status.filterPump,
          });
        }
      }

      // Refresh status shortly after sending commands
      setTimeout(fetchSpaStatus, 2000);
    } catch (err) {
      console.error(`Failed to toggle ${device}:`, err);
      setSpaData(prevState); // revert
    } finally {
      setLoading(false);
    }
  };

  const handleTemperatureChange = async (newTemp) => {
    try {
      setLoading(true);
      setSpaData(prev => ({ ...prev, spaSetPoint: newTemp }));
      await setSpaTemperature(newTemp);
      setTimeout(fetchSpaStatus, 2000);
    } catch (err) {
      console.error('Failed to set spa temperature:', err);
      fetchSpaStatus(); // Refresh to get actual value
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    fetchSpaStatus();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(fetchSpaStatus, 5000);

    return () => clearInterval(interval);
  }, [authenticated]);

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
        <p>Guest Control Panel</p>
      </header>

      <main className="app-main">
        <TemperatureDisplay 
          airTemp={spaData.airTemp}
          spaTemp={spaData.spaTemp}
          poolTemp={spaData.poolTemp}
          spaSetPoint={spaData.spaSetPoint}
          onTemperatureChange={handleTemperatureChange}
          disabled={loading}
        />
        
        <SpaControls
          spaMode={spaData.spaMode}
          spaHeater={spaData.spaHeater}
          jetPump={spaData.jetPump}
          filterPump={spaData.filterPump}
          onToggle={handleToggle}
          disabled={loading}
        />
      </main>

      <footer className="app-footer">
        <p>🔄 Auto-refresh every 5 seconds</p>
        <p>Status: {spaData.connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </footer>
    </div>
  );
}

export default App;
