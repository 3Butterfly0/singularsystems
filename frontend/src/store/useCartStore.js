import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingItemIndex = state.items.findIndex(
          (i) => i.id === item.id && i.type === item.type
        );

        if (existingItemIndex > -1) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += (item.quantity || 1);
          return { items: newItems };
        }

        return { items: [...state.items, { ...item, cartItemId: Date.now().toString(), quantity: item.quantity || 1 }] };
      }),

      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter((i) => i.cartItemId !== cartItemId)
      })),

      updateQuantity: (cartItemId, quantity) => set((state) => ({
        items: state.items.map((i) => 
          i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, quantity) } : i
        )
      })),

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'ss-cart-storage',
    }
  )
);

export default useCartStore;
