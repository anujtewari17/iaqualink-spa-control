import React, { useState } from 'react';

function Login({ onLogin }) {
  const [key, setKey] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      onLogin(key.trim());
    }
  };

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
      </form>
    </div>
  );
}

export default Login;
