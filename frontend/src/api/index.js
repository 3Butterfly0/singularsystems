import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  
  // get session secret from zustand
  const buildStorage = localStorage.getItem('ss-build-storage');
  if (buildStorage) {
    try {
      const { state } = JSON.parse(buildStorage);
      if (state.sessionSecret) {
        config.headers['X-BUILD-SESSION-SECRET'] = state.sessionSecret;
      }
    } catch (e) {
      console.error('Failed to parse build storage', e);
    }
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
