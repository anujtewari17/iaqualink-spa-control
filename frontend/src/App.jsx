import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SpaControls from './components/SpaControls';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import {
  getSpaStatus,
  toggleSpaDevice,
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
    connected: true,
    airTemp: null,
    spaTemp: null,
    poolTemp: null,
    spaSetPoint: null,
    lastUpdate: null
  });

  const [loading, setLoading] = useState(true);
  const [statusFailures, setStatusFailures] = useState(0);
  const [commandState, setCommandState] = useState({
    active: false,
    message: '',
    device: null
  });

  const applyBackendStatus = (status) => {
    setStatusFailures(0);
    setSpaData((prev) => ({
      ...prev,
      spaMode: !!status.spaMode,
      spaHeater: !!status.spaHeater,
      jetPump: !!status.jetPump,
      filterPump: !!status.filterPump,
      airTemp: Number.isFinite(status.airTemp) ? status.airTemp : null,
      spaTemp:
        status.spaMode && Number.isFinite(status.spaTemp) ? status.spaTemp : null,
      poolTemp: Number.isFinite(status.poolTemp) ? status.poolTemp : null,
      spaSetPoint: Number.isFinite(status.spaSetPoint) ? status.spaSetPoint : null,
      connected: status.connected !== undefined ? !!status.connected : true,
      lastUpdate: status.lastUpdate
        ? new Date(status.lastUpdate)
        : new Date()
    }));
  };
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
      applyBackendStatus(status);
    } catch (err) {
      console.error('Failed to fetch spa status:', err);
      setStatusFailures((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setSpaData((prevData) => ({ ...prevData, connected: false }));
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (device) => {
    if (!authenticated) return;
    if (commandState.active && commandState.device === device) {
      setCommandState((prev) => ({
        ...prev,
        message: 'Working on your previous request...'
      }));
      return;
    }

    const setCommandMessage = (message) =>
      setCommandState({ active: true, message, device });

    const ensureSpaStarts = async (retries = 3) => {
      let latestStatus = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        const attemptLabel = attempt === 0
          ? 'Starting spa...'
          : `Retrying to start spa (attempt ${attempt + 1}/${retries})...`;
        setCommandMessage(attemptLabel);

        await toggleSpaDevice('spa-mode');
        await toggleSpaDevice('spa-heater');
        latestStatus = await getSpaStatus();

        if (latestStatus?.spaMode && latestStatus?.spaHeater) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      return latestStatus;
    };

    const ensureDeviceState = async (targetState, statusKey, retries = 3) => {
      let latestStatus = null;
      const friendlyName =
        statusKey === 'jetPump' ? 'jet pump' : 'filter pump';

      for (let attempt = 0; attempt < retries; attempt++) {
        const attemptLabel = attempt === 0
          ? `Sending ${friendlyName} command...`
          : `Confirming ${friendlyName} change (attempt ${attempt + 1}/${retries})...`;
        setCommandMessage(attemptLabel);

        await toggleSpaDevice(device);
        latestStatus = await getSpaStatus();
        if (latestStatus && Boolean(latestStatus[statusKey]) === targetState) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      return latestStatus;
    };

    try {
      setLoading(true);

      if (device === 'spa') {
        const targetOn = !spaData.spaMode;

        if (targetOn) {
          const status = await ensureSpaStarts();
          if (status) applyBackendStatus(status);
        } else {
          setCommandState({ active: true, message: 'Shutting spa down...' });
          await toggleSpaDevice('spa-mode');
          await toggleSpaDevice('spa-heater');

          if (spaData.filterPump) {
            await toggleSpaDevice('filter-pump');
          }

          const status = await getSpaStatus();
          if (status) applyBackendStatus(status);
        }
      } else {
        const targetOn = device === 'jet-pump' ? !spaData.jetPump : !spaData.filterPump;
        const statusKey = device === 'jet-pump' ? 'jetPump' : 'filterPump';
        const status = await ensureDeviceState(targetOn, statusKey);

        if (status) {
          applyBackendStatus(status);
        } else {
          setCommandMessage('Waiting for backend reading...');
        }
      }

      // Refresh status shortly after sending commands
      setTimeout(fetchSpaStatus, 2000);
    } catch (err) {
      console.error(`Failed to toggle ${device}:`, err);
    } finally {
      setLoading(false);
      setCommandState({ active: false, message: '', device: null });
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
  const lastUpdatedLabel = spaData.lastUpdate
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }).format(spaData.lastUpdate)
    : 'pending';

  const locationLabel =
    locationAllowed === null
      ? 'Checking location'
      : locationAllowed
      ? 'Location ok'
      : 'Location needed';

  const guestPage = (
    <div className="app-shell">
      <div className="gradient" aria-hidden></div>
      <div className="app compact">
        <header className="compact-hero card">
          <div>
            <p className="eyebrow">Spa Control</p>
            <h1>Quick access</h1>
          </div>
          <div className="badge-row tight">
            <span className={`pill ${spaData.connected ? 'pill-success' : 'pill-danger'}`}>
              {spaData.connected ? '🟢 Online' : '🔴 Offline'}
            </span>
            <span className={`pill ${withinSpaHours ? 'pill-info' : 'pill-warning'}`}>
              {withinSpaHours ? '6a–10p' : 'Outside hours'}
            </span>
            <span className="pill pill-ghost">Updated {lastUpdatedLabel}</span>
          </div>
        </header>

        <main className="app-main compact-main">
          <SpaControls
            spaMode={spaData.spaMode}
            spaTemp={spaData.spaTemp}
            spaHeater={spaData.spaHeater}
            jetPump={spaData.jetPump}
            filterPump={spaData.filterPump}
            connected={spaData.connected}
            locationLabel={locationLabel}
            commandMessage={commandState.message}
            commandActive={commandState.active}
            onToggle={handleToggle}
            disabled={loading || !withinSpaHours || commandState.active}
          />
        </main>
      </div>
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
