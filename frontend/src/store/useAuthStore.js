import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  fetchUser: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/accounts/me/');
      set({ user: res.data, isAuthenticated: true, loading: false });
      localStorage.setItem('is_logged_in', 'true');
    } catch (error) {
      set({ user: null, isAuthenticated: false, loading: false });
      localStorage.removeItem('is_logged_in');
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      await api.post('/accounts/login/', credentials);
      localStorage.setItem('is_logged_in', 'true');
      set({ isAuthenticated: true, loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Login failed', loading: false });
      return false;
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      await api.post('/accounts/signup/', userData);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Signup failed', loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/accounts/logout/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('is_logged_in');
    set({ user: null, isAuthenticated: false });
    
    // Clear private state in other stores or redirect
    window.location.href = '/';
  }
}));

export default useAuthStore;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'is_logged_in') {
      useAuthStore.setState({
        isAuthenticated: event.newValue === 'true',
        user: event.newValue === 'true' ? useAuthStore.getState().user : null,
      });
    }
  });
}
