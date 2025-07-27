import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SpaControls from './components/SpaControls';
import TemperatureDisplay from './components/TemperatureDisplay';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import {
  getSpaStatus,
  toggleSpaDevice,
  setSpaTemperature,
  checkLocation,
  getActiveReservation
} from './services/spaAPI';

const getWithinSpaHours = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 22; // 6am - 10pm
};

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem('accessKey')
  );
  // null -> checking, true -> admin, false -> guest
  const [isAdmin, setIsAdmin] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [locationAllowed, setLocationAllowed] = useState(null);
  const [withinSpaHours, setWithinSpaHours] = useState(getWithinSpaHours());
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
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setLocationAllowed(true); // treat as allowed when geolocation unsupported
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const allowed = await checkLocation(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setLocationAllowed(allowed);
        } catch (err) {
          console.error('Location check failed', err);
          setLocationAllowed(true); // default to allowed on error
        }
      },
      () => setLocationAllowed(true)
    );
  };

  const checkAdmin = async () => {
    try {
      const res = await getActiveReservation();
      setReservations(res ? [res] : []);
      setIsAdmin(true);
      return true;
    } catch (err) {
      setIsAdmin(false);
      return false;
    }
  };

const handleLogin = (key) => {
  localStorage.setItem('accessKey', key);
  setAuthenticated(true);
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
    checkAdmin();
  }, [authenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWithinSpaHours(getWithinSpaHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
   if (!authenticated || !isAdminRoute) return;
    checkAdmin();
  }, [authenticated, isAdminRoute]);

  useEffect(() => {
    if (!authenticated || isAdminRoute) return;
    verifyLocation();
    fetchSpaStatus();
    const interval = setInterval(fetchSpaStatus, 5000);
    return () => clearInterval(interval);
  }, [authenticated, isAdminRoute]);

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }
  const guestPage = (
    <div className="app">
      <header className="app-header">
        <h1>🌊 Spa Control</h1>
        <p>Guest Control Panel</p>
        <p>Status: {spaData.connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p>Spa hours: 6am-10pm</p>
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
          disabled={loading || !withinSpaHours}
        />
      </main>

      <footer className="app-footer">
        <p>🔄 Auto-refresh every 5 seconds</p>
      </footer>
    </div>
  );

  const loadingScreen = (
    <div className="app">
      <div className="loading">
        <div className="spinner"></div>
        <p>Connecting to spa system...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/admin"
        element={
         isAdmin === null ? (
            loadingScreen
          ) : isAdmin ? (
            <AdminPanel reservations={reservations} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/"
        element={loading && !spaData.lastUpdate ? loadingScreen : guestPage}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
