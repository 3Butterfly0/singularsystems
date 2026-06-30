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

  const guestToken = localStorage.getItem('guest_token');
  if (guestToken) {
    config.headers['X-GUEST-TOKEN'] = guestToken;
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refreshing the token itself fails
      if (
        originalRequest.url === '/accounts/login/refresh/' ||
        originalRequest.url === '/accounts/login/' ||
        originalRequest.url?.includes('accounts/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/accounts/login/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        try {
          // Dynamic import to break circular dependency
          const useAuthStore = (await import('../store/useAuthStore')).default;
          useAuthStore.getState().logout();
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
