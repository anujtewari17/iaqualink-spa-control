import { useEffect, useState } from 'react';
import './style.css';

const FEATURES = {
  spa_mode: 'Spa Mode',
  spa_heater: 'Spa Heater',
  jet_pump: 'Jet Pump'
};

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const { sessionId } = await res.json();
      localStorage.setItem('sessionId', sessionId);
      onLogin(sessionId);
    } else {
      setError('Login failed');
    }
  };

  return (
    <form className="login" onSubmit={submit}>
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      <input
        type="text"
        placeholder="Email"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
    </form>
  );
}

export default function App() {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'));
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const res = await fetch('/api/status', {
      headers: { 'x-session-id': sessionId }
    });
    if (res.status === 401) {
      setSessionId(null);
      localStorage.removeItem('sessionId');
      return;
    }
    const data = await res.json();
    setState(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, [sessionId]);

  const toggle = async feature => {
    const newState = !state[feature];
    setState({ ...state, [feature]: newState });
    await fetch('/api/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({ feature, state: newState })
    });
  };

  if (!sessionId) return <Login onLogin={setSessionId} />;

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1>Spa Control</h1>
      <button className="logout" onClick={() => { localStorage.removeItem('sessionId'); setSessionId(null); }}>Logout</button>
      <div className="temps">
        <div>Air: {state.air_temp}°F</div>
        <div>Pool: {state.pool_temp}°F</div>
        <div>Spa: {state.spa_temp}°F</div>
      </div>
      <div className="controls">
        {Object.entries(FEATURES).map(([key, label]) => (
          <button
            key={key}
            className={state[key] ? 'active' : ''}
            onClick={() => toggle(key)}
          >
            {label}: {state[key] ? 'On' : 'Off'}
          </button>
        ))}
      </div>
    </div>
  );
}
