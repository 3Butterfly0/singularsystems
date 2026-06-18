import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // get session secret from zustand (only for builder endpoints)
  if (config.url?.startsWith('/builder/') || config.url?.includes('/builder/')) {
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
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Prevent infinite loops if refresh itself fails
    if (error.response?.status === 401 && originalRequest.url !== '/accounts/login/refresh/' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/accounts/login/refresh/');
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, user is really logged out.
        localStorage.removeItem('is_logged_in');
        window.dispatchEvent(new Event('storage'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
