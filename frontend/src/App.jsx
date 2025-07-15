import React, { useState, useEffect } from 'react';
import SpaControls from './components/SpaControls';
// Status display removed for streamlined interface
import Login from './components/Login';
import { getSpaStatus, toggleSpaDevice } from './services/spaAPI';

function App() {
  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem('accessKey')
  );
  const [spaData, setSpaData] = useState({
    spaMode: false,
    spaHeater: false,
    jetPump: false,
    connected: false,
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
      setSpaData(prev => ({
        ...prev,
        spaMode: !!status.spaMode,
        spaHeater: !!status.spaHeater,
        jetPump: !!status.jetPump,
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
        optimisticUpdate({ spaMode: newState, spaHeater: newState });

        await toggleSpaDevice('spa-mode');
        const result = await toggleSpaDevice('spa-heater');
        if (result && result.status) {
          optimisticUpdate({
            spaMode: !!result.status.spaMode,
            spaHeater: !!result.status.spaHeater,
            jetPump: result.status.jetPump ?? spaData.jetPump,
            connected: true,
          });
        } else {
          await fetchSpaStatus();
        }
      } else {
        const keyMap = { 'jet-pump': 'jetPump' };
        optimisticUpdate({ [keyMap[device]]: !spaData[keyMap[device]] });

        const result = await toggleSpaDevice(device);
        if (result && result.status) {
          const status = result.status;
          optimisticUpdate({
            spaMode: status.spaMode ?? spaData.spaMode,
            spaHeater: status.spaHeater ?? spaData.spaHeater,
            jetPump: status.jetPump ?? spaData.jetPump,
            connected: true,
          });
        } else {
          await fetchSpaStatus();
        }
      }
    } catch (err) {
      console.error(`Failed to toggle ${device}:`, err);
      setSpaData(prevState); // revert
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
        <p>Guest Access Panel</p>
      </header>

      <main className="app-main">

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
        <p>System updates every 5 seconds</p>
      </footer>
    </div>
  );
}

export default App;
