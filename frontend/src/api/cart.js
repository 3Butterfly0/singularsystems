import api from './index';

export const getCart = async () => {
  const { data } = await api.get('/cart/');
  return data;
};

export const addCartItem = async (payload) => {
  const { data } = await api.post('/cart/items/', payload);
  return data;
};

export const removeCartItem = async (itemId) => {
  const { data } = await api.delete(`/cart/items/${itemId}/`);
  return data;
};

export const repriceCart = async () => {
  const { data } = await api.post('/cart/reprice/');
  return data;
};

export const claimGuestCart = async (guestToken) => {
  const { data } = await api.post('/cart/claim-guest/', { guest_token: guestToken });
  return data;
};
