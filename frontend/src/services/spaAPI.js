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
  try {
    const response = await api.get('/api/status');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch spa status');
  }
};

export const toggleSpaDevice = async (device) => {
  try {
    const response = await api.post(`/api/toggle/${device}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to toggle ${device}`);
  }
};

export const setSpaTemperature = async (temperature) => {
  try {
    const response = await api.post('/api/set-temperature', { temperature });
    return response.data;
  } catch (error) {
    throw new Error('Failed to set spa temperature');
  }
};

export const checkLocation = async (latitude, longitude) => {
  try {
    const res = await api.post('/api/check-location', { latitude, longitude });
    return res.data.allowed;
  } catch (error) {
    throw new Error('Failed to verify location');
  }
};


export default api;
