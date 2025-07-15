import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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

export default api;
