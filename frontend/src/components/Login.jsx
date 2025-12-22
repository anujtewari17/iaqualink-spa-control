import React, { useState, useEffect } from 'react';
import { validateAccessKey } from '../services/spaAPI';

function Login({ onLogin }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const attemptLogin = async (k) => {
    try {
      await validateAccessKey(k);
      onLogin(k);
    } catch (err) {
      // If it's a 402, the key is valid but payment is required.
      // We should treat this as a successful login so the App can show the PaymentGate.
      if (err.response?.status === 402) {
        onLogin(k);
        return;
      }
      console.error('Login Error:', err);
      setError('Invalid access key');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      attemptLogin(key.trim());
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    if (urlKey) {
      setKey(urlKey);
      attemptLogin(urlKey);
    }
  }, []);

  return (
    <div className="login-screen">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Enter Access Key</h2>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Access Key"
        />
        <button type="submit">Unlock</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Login;
