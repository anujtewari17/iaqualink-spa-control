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
    try {
      setLoading(true);
      const result = await toggleSpaDevice(device);
      if (result && result.status) {
        const status = result.status;
        setSpaData(prev => ({
          ...prev,
          spaMode: status.spaMode ?? prev.spaMode,
          spaHeater: status.spaHeater ?? prev.spaHeater,
          jetPump: status.jetPump ?? prev.jetPump,
          connected: true,
          lastUpdate: new Date()
        }));
      } else {
        // Fallback: refresh status
        await fetchSpaStatus();
      }
    } catch (err) {
      console.error(`Failed to toggle ${device}:`, err);
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
