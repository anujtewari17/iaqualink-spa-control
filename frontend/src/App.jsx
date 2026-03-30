import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SpaControls from './components/SpaControls';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PaymentGate from './components/PaymentGate';
import {
  getSpaStatus,
  toggleSpaDevice,
  checkLocation,
  getActiveReservation,
  getSessionStatus
} from './services/spaAPI';

const getWithinSpaHours = () => {
  const hour = new Date().getHours();
  return hour >= 5 && hour <= 23; // 5am - 12am (lockout 12a-5a)
};

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [authenticated, setAuthenticated] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    const storedKey = localStorage.getItem('accessKey');

    if (urlKey) {
      localStorage.setItem('accessKey', urlKey);
      return true;
    }

    // If no key anywhere, default to 'katmaiguest' to show payment gate immediately
    if (!storedKey) {
      localStorage.setItem('accessKey', 'katmaiguest');
      return true;
    }
    return true; // We always have at least 'katmaiguest' now
  });
  // null -> checking, true -> admin, false -> guest
  const [isAdmin, setIsAdmin] = useState(null);
  const [guestStatus, setGuestStatus] = useState(null);
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
  const [heatingHistory, setHeatingHistory] = useState([]); // Array of { temp, time }

  const [loading, setLoading] = useState(true);
  const [statusFailures, setStatusFailures] = useState(0);
  const [commandState, setCommandState] = useState({
    active: false,
    message: '',
    device: null
  });
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const applyBackendStatus = (status) => {
    setStatusFailures(0);
    const now = status.lastUpdate ? new Date(status.lastUpdate) : new Date();
    const currentTemp = status.spaMode && Number.isFinite(status.spaTemp) ? status.spaTemp : null;

    setSpaData((prev) => ({
      ...prev,
      spaMode: !!status.spaMode,
      spaHeater: !!status.spaHeater,
      jetPump: !!status.jetPump,
      filterPump: !!status.filterPump,
      airTemp: Number.isFinite(status.airTemp) ? status.airTemp : null,
      spaTemp: currentTemp,
      poolTemp: Number.isFinite(status.poolTemp) ? status.poolTemp : null,
      spaSetPoint: Number.isFinite(status.spaSetPoint) ? status.spaSetPoint : null,
      connected: status.connected !== undefined ? !!status.connected : true,
      lastUpdate: now
    }));

    // Track history if spa mode active (heater may not always report separately)
    if ((!!status.spaHeater || !!status.spaMode) && currentTemp !== null) {
      setHeatingHistory(prev => {
        const newEntry = { temp: currentTemp, time: now.getTime() };
        // Keep last 30 minutes of history
        const filtered = prev.filter(h => now.getTime() - h.time < 30 * 60 * 1000);
        // Only add if temp changed or it's been a while (5 mins)
        const last = filtered[filtered.length - 1];
        if (!last || last.temp !== currentTemp || now.getTime() - last.time > 5 * 60 * 1000) {
          return [...filtered, newEntry];
        }
        return filtered;
      });
    } else if (!status.spaHeater) {
      setHeatingHistory([]); // Reset when heater is off
    }
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
      // If we got here, we are an admin (no 403 error)
      setGuestStatus(res.guestStatus);
      setIsAdmin(true);
      return true;
    } catch (err) {
      console.log('Not an admin, redirecting...');
      setIsAdmin(false);
      return false;
    }
  };

  const handleLogin = (key) => {
    localStorage.setItem('accessKey', key);
    setAuthenticated(true);
    // Explicitly re-check admin status after a manual login
    checkAdmin();
  };

  const calculateHeatEstimate = () => {
    if ((!spaData.spaHeater && !spaData.spaMode) || !spaData.spaTemp) return null;
    const target = spaData.spaSetPoint || 101;
    if (spaData.spaTemp >= target) return { eta: 'Ready! 🎉', ratePerHr: null, hasRealData: true };

    const diff = target - spaData.spaTemp;

    if (heatingHistory.length >= 2) {
      const first = heatingHistory[0];
      const last = heatingHistory[heatingHistory.length - 1];
      const tempDiff = last.temp - first.temp;
      const timeDiffMin = (last.time - first.time) / (1000 * 60);

      if (timeDiffMin >= 5) {
        if (tempDiff > 0) {
          // Good measurable rate
          const ratePerMin = tempDiff / timeDiffMin;
          const ratePerHr = ratePerMin * 60;
          const minsRemaining = Math.ceil(diff / ratePerMin);
          const readyTime = new Date(Date.now() + minsRemaining * 60 * 1000);
          const timeStr = readyTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return {
            eta: `~${minsRemaining} min  ·  ready by ${timeStr}`,
            ratePerHr: ratePerHr.toFixed(1),
            hasRealData: true
          };
        } else {
          // Have 5+ min of history but temp is stable/cycling near setpoint
          // Use conservative 0.5°F/hr so we don't stay stuck on "Gathering data…"
          const minsRemaining = Math.ceil(diff / (0.5 / 60));
          const readyTime = new Date(Date.now() + minsRemaining * 60 * 1000);
          const timeStr = readyTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return {
            eta: `Almost ready  ·  ~${minsRemaining} min`,
            ratePerHr: null,
            hasRealData: false
          };
        }
      }
    }

    // Not enough time elapsed yet
    return { eta: 'Gathering data…', ratePerHr: null, hasRealData: false };
  };

  const fetchSpaStatus = async () => {
    if (!authenticated) return;
    try {
      const status = await getSpaStatus();
      applyBackendStatus(status);
      setPaymentRequired(false);
    } catch (err) {
      console.error('Failed to fetch spa status:', err);
      if (err.response?.status === 402) {
        setPaymentRequired(true);
        setPaymentMessage(err.response.data.message);
        // Clear spa data so we don't show stale info behind the gate
        setSpaData(prev => ({ ...prev, lastUpdate: null }));
        return;
      }
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
    const key = localStorage.getItem('accessKey');
    if (!authenticated || !isAdminRoute || !key) return;
    checkAdmin();
  }, [authenticated, isAdminRoute, localStorage.getItem('accessKey')]);

  useEffect(() => {
    if (!authenticated || isAdminRoute || paymentRequired) return;
    verifyLocation();
    fetchSpaStatus();
    const interval = setInterval(fetchSpaStatus, 5000);
    return () => clearInterval(interval);
  }, [authenticated, isAdminRoute, paymentRequired]);

  // Priority: Handle new keys in the URL even if already authenticated
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    const currentKey = localStorage.getItem('accessKey');

    if (urlKey && urlKey !== currentKey) {
      console.log('New key detected in URL, updating session...');
      handleLogin(urlKey);
      // Reset critical states for the new identity
      setPaymentRequired(false);
      setLoading(true);
      setIsAdmin(null);
      fetchSpaStatus();
    }
  }, [location.search]);

  // Handle return from Stripe payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId && authenticated) {
      const verifyPayment = async () => {
        try {
          const status = await getSessionStatus(sessionId);
          if (status.status === 'complete' && status.payment_status === 'paid') {
            console.log('Payment verified successfully!');
            // Clear URL and refresh
            window.history.replaceState({}, document.title, window.location.pathname);
            setPaymentRequired(false);
            fetchSpaStatus();
          }
        } catch (err) {
          console.error('Failed to verify payment session:', err);
        }
      };
      verifyPayment();
    }
  }, [authenticated]);

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
            <h1 style={{ marginBottom: '1rem' }}>Quick access</h1>

            {(spaData.spaHeater || spaData.spaMode) && spaData.spaTemp && spaData.spaTemp < (spaData.spaSetPoint || 101) && (() => {
              const estimate = calculateHeatEstimate();
              if (!estimate) return null;
              const progressPct = Math.min(100, Math.max(0, ((spaData.spaTemp - 60) / ((spaData.spaSetPoint || 101) - 60)) * 100));
              return (
                <div className="card" style={{
                  background: 'rgba(255,165,0,0.08)',
                  border: '1px solid rgba(255,165,0,0.25)',
                  padding: '0.9rem 1rem',
                  marginBottom: '1.2rem',
                  borderRadius: '12px'
                }}>
                  {/* ETA row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.55rem' }}>
                    <p style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                      🔥 {estimate.eta}
                    </p>
                    {estimate.ratePerHr && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,165,0,0.8)', fontWeight: 500 }}>
                        {estimate.ratePerHr}°F/hr
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, rgba(255,140,0,0.6), rgba(255,200,0,0.9))',
                      borderRadius: '99px',
                      transition: 'width 1s ease'
                    }} />
                  </div>

                  {/* Labels under bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    <span className="muted" style={{ fontSize: '0.7rem' }}>{spaData.spaTemp}°F now</span>
                    <span className="muted" style={{ fontSize: '0.7rem' }}>Target: {spaData.spaSetPoint || 101}°F</span>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="badge-row tight">
            <span className={`pill ${spaData.connected ? 'pill-success' : 'pill-danger'}`}>
              {spaData.connected ? '🟢 Online' : '🔴 Offline'}
            </span>
            <span className={`pill ${withinSpaHours ? 'pill-info' : 'pill-warning'}`}>
              {withinSpaHours ? '5a–12a Access' : 'Outside hours (12a-5a)'}
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
            <AdminPanel guestStatus={guestStatus} onRefresh={checkAdmin} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/"
        element={
          loading && !spaData.lastUpdate ? (
            loadingScreen
          ) : paymentRequired ? (
            <PaymentGate message={paymentMessage} />
          ) : (
            guestPage
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
