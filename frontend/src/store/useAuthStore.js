import { create } from 'zustand';
import api from '../api';
import useCartStore from './useCartStore';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/accounts/login/', credentials);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      set({ isAuthenticated: true, loading: false });
      useCartStore.getState().claimGuest();
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

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
    useCartStore.getState().clearCart();
    useCartStore.getState().fetchCart();
  }
}));

export default useAuthStore;
