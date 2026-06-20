import { create } from 'zustand';
import { getCart, addCartItem, removeCartItem, repriceCart, claimGuestCart } from '../api/cart';

// Ensure guest token exists
if (!localStorage.getItem('guest_token')) {
  localStorage.setItem('guest_token', crypto.randomUUID());
}

const useCartStore = create((set, get) => ({
  items: [],
  totalPrice: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await getCart();
      const mappedItems = (data.items || []).map(item => {
        let name = 'Custom System';
        let image = null;
        if (item.item_type === 'prebuilt' && item.prebuilt) {
          name = item.prebuilt.name;
          image = item.prebuilt.image;
        } else if (item.item_type === 'custom_build' && item.build_session) {
          image = item.build_session.case ? item.build_session.case.image : null;
        }
        return {
          cartItemId: item.id,
          type: item.item_type,
          id: item.item_type === 'prebuilt' ? item.prebuilt?.id : item.build_session?.id,
          name: name,
          price: item.price_at_add,
          image: image,
          quantity: 1,
          sessionId: item.item_type === 'custom_build' ? item.build_session?.id : null
        };
      });
      set({ items: mappedItems, totalPrice: data.total_price || 0, loading: false });
    } catch (e) {
      console.error('Failed to fetch cart', e);
      set({ loading: false });
    }
  },

  addItem: async (payload) => {
    // payload: { type: 'custom_build' or 'prebuilt', id: build_session_id or prebuilt_id }
    const backendPayload = {
      item_type: payload.type,
    };
    if (payload.type === 'custom_build') {
      backendPayload.build_session_id = payload.id || payload.sessionId;
    } else if (payload.type === 'prebuilt') {
      backendPayload.prebuilt_id = payload.id;
    }
    
    try {
      await addCartItem(backendPayload);
      await get().fetchCart();
    } catch (e) {
      console.error('Failed to add item', e);
    }
  },

  removeItem: async (cartItemId) => {
    try {
      await removeCartItem(cartItemId);
      await get().fetchCart();
    } catch (e) {
      console.error('Failed to remove item', e);
    }
  },

  reprice: async () => {
    set({ loading: true });
    try {
      const data = await repriceCart();
      set({ items: data.items || [], totalPrice: data.total_price || 0, loading: false });
    } catch (e) {
      console.error('Failed to reprice cart', e);
      set({ loading: false });
    }
  },

  claimGuest: async () => {
    const guestToken = localStorage.getItem('guest_token');
    if (guestToken) {
      try {
        await claimGuestCart(guestToken);
        // Clear old guest token and generate a new one for future guest sessions if user logs out
        localStorage.setItem('guest_token', crypto.randomUUID()); 
        await get().fetchCart();
      } catch (e) {
        console.error('Failed to claim guest cart', e);
      }
    }
  },

  clearCart: () => set({ items: [], totalPrice: 0 }),
  
  getTotal: () => get().totalPrice,
  getItemCount: () => get().items.length,
}));

export default useCartStore;
