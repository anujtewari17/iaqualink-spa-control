// iAquaLink 2.0 Simplified Spa Control Proxy
// Only handles spa mode, spa heat, filter pump, and temperature

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case 'login':
        return await handleLogin(req, res, params);
      case 'get_devices':
        return await handleGetDevices(req, res, params);
      case 'get_session':
        return await handleGetSession(req, res, params);
      case 'control_device':
        return await handleControlDevice(req, res, params);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleLogin(req, res, { email, password }) {
  const response = await fetch('https://prod.zodiac-io.com/users/v1/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'iAquaLink/5.0 (iOS; iPhone)',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      api_key: 'EOOEMOW4YR6QNB07',
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data.message || 'Authentication failed' });
  }

  // Return authentication tokens
  return res.status(200).json({
    success: true,
    authentication_token: data.authentication_token,
    user_id: data.user_id,
    session_id: data.session_id
  });
}

async function handleGetDevices(req, res, { api_key, authentication_token, user_id }) {
  const url = `https://r-api.iaqualink.net/devices.json?api_key=${api_key}&authentication_token=${authentication_token}&user_id=${user_id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'iAquaLink/5.0 (iOS; iPhone)',
      'Accept': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch devices' });
  }

  return res.status(200).json(data);
}

async function handleGetSession(req, res, { api_key, authentication_token, user_id, serial }) {
  const url = `https://p-api.iaqualink.net/v1/mobile/session.json?api_key=${api_key}&authentication_token=${authentication_token}&user_id=${user_id}&serial=${serial}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'iAquaLink/5.0 (iOS; iPhone)',
      'Accept': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch session data' });
  }

  // Filter to only return spa-related devices
  if (data.home_screen) {
    data.home_screen = filterSpaDevices(data.home_screen);
  }

  return res.status(200).json(data);
}

async function handleControlDevice(req, res, { api_key, authentication_token, user_id, serial, device, command }) {
  const url = `https://p-api.iaqualink.net/v1/mobile/session.json?api_key=${api_key}&authentication_token=${authentication_token}&user_id=${user_id}&serial=${serial}&command=${command}&device=${device}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'iAquaLink/5.0 (iOS; iPhone)',
      'Accept': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to control device' });
  }

  return res.status(200).json(data);
}

// Filter devices to only show spa controls we want
function filterSpaDevices(devices) {
  const allowedDevices = [
    'spa_temp',      // Spa temperature sensor
    'spa_set_point', // Spa temperature set point
    'spa_heater',    // Spa heater
    'filter_pump',   // Filter pump
    'spa_mode'       // Spa mode toggle
  ];

  const filteredDevices = devices.filter(device => {
    // Include main spa device types
    if (allowedDevices.includes(device.name)) {
      return true;
    }

    // Include aux devices that might be labeled as spa mode or filter pump
    if (device.aux && device.label) {
      const label = device.label.toLowerCase();
      return label.includes('spa') || 
             label.includes('filter') || 
             label.includes('pump');
    }

    return false;
  });

  return filteredDevices;
}
