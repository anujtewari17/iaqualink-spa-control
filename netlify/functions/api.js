const axios = require('axios');

const BASE_URL = 'https://r-api.iaqualink.net/v1/mobile_app';
const SERIAL = process.env.IAQUALINK_SERIAL;
const sessions = {};

async function iaqualinkLogin(username, password) {
  const res = await axios.post(`${BASE_URL}/login`, {
    email: username,
    password,
    app_version: '1.0.0',
  });
  return res.data.authentication_token;
}

async function iaqualinkRequest(token, path, method = 'get', data) {
  const res = await axios({
    method,
    url: `${BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return res.data;
}

exports.handler = async function(event) {
  const { path, httpMethod } = event;
  const route = path.replace('/.netlify/functions/api', '');

  try {
    if (route === '/login' && httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}');
      if (!username || !password) {
        return { statusCode: 400, body: 'Missing credentials' };
      }
      try {
        const token = await iaqualinkLogin(username, password);
        const sessionId = Math.random().toString(36).slice(2);
        sessions[sessionId] = token;
        return { statusCode: 200, body: JSON.stringify({ sessionId }) };
      } catch (e) {
        return { statusCode: 401, body: 'Invalid credentials' };
      }
    }

    const sessionId = event.headers['x-session-id'];
    const token = sessions[sessionId];
    if (!token) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    if (route === '/status' && httpMethod === 'GET') {
      const data = await iaqualinkRequest(token, `/devices/${SERIAL}/home`);
      const result = {
        air_temp: data.air_temp,
        pool_temp: data.pool_temp,
        spa_temp: data.spa_temp,
        spa_mode: data.spa_mode,
        spa_heater: data.spa_heater,
        jet_pump: data.jet_pump,
      };
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    if (route === '/toggle' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { feature, state } = body;
      if (!['spa_mode','spa_heater','jet_pump'].includes(feature)) {
        return { statusCode: 400, body: 'Invalid feature' };
      }
      await iaqualinkRequest(token, `/devices/${SERIAL}/set_${feature}`, 'post', { value: state ? 'on' : 'off' });
      return { statusCode: 200, body: 'ok' };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
