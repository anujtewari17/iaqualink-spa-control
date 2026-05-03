import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access key from localStorage if present
api.interceptors.request.use((config) => {
  const key = localStorage.getItem('accessKey');
  if (key) {
    config.headers['x-access-key'] = key;
  }
  return config;
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getSpaStatus = async () => {
  const response = await api.get('/api/status');
  return response.data;
};

export const toggleSpaDevice = async (device) => {
  const response = await api.post(`/api/toggle/${device}`);
  return response.data;
};

export const setSpaTemperature = async (temperature) => {
  const response = await api.post('/api/set-temperature', { temperature });
  return response.data;
};

export const setHeatingRate = async (rate) => {
  const response = await api.post('/api/set-heating-rate', { rate });
  return response.data;
};

export const checkLocation = async (latitude, longitude) => {
  const res = await api.post('/api/check-location', { latitude, longitude });
  return res.data.allowed;
};

export const getActiveReservation = async () => {
  const res = await api.get('/api/keys');
  return res.data;
};

export const validateAccessKey = async (key) => {
  const res = await api.get('/api/status', {
    headers: { 'x-access-key': key },
  });
  return res.data;
};

export const getAccessKey = () => localStorage.getItem('accessKey');

export const startSpaSession = async (hours = 1) => {
  const res = await api.post('/api/sessions/start', { hours });
  return res.data;
};

export const getSpaSessionStatus = async () => {
  const response = await api.get(`/api/sessions/status`);
  return response.data;
};

export const clearSpaSession = async () => {
  const response = await api.post(`/api/sessions/clear`);
  return response.data;
};

export default api;
