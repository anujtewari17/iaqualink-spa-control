import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

export const createCheckoutSession = async (nights = 1) => {
  const accessKey = getAccessKey();
  const res = await api.post('/api/payments/create-checkout-session', { accessKey, nights });
  return res.data;
};

export const getSessionStatus = async (sessionId) => {
  const response = await api.get(`/api/payments/session-status?session_id=${sessionId}`);
  return response.data;
};

export const clearPayment = async (targetKey) => {
  console.log(`[API] Sending clear-payment request for: ${targetKey} to ${API_BASE_URL}/api/payments/clear-payment`);
  const response = await api.post('/api/payments/clear-payment', { targetKey });
  return response.data;
};

export const manualAddPayment = async (targetKey, nights = 1) => {
  const response = await api.post('/api/payments/manual-add', { targetKey, nights });
  return response.data;
};

export default api;
