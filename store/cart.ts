// store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartStore, Product, CartItem } from '@/types';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, options?: Record<string, string>) => {
        const cartKey = `${product.id}-${JSON.stringify(options || {})}`;
        
        set((state) => {
          const existingItem = state.items.find(item => item.cartKey === cartKey);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.cartKey === cartKey
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          } else {
            const newItem: CartItem = {
              ...product,
              quantity: 1,
              selectedOptions: options,
              cartKey,
            };
            
            return {
              items: [...state.items, newItem],
            };
          }
        });
      },

      removeItem: (cartKey: string) => {
        set((state) => ({
          items: state.items.filter(item => item.cartKey !== cartKey),
        }));
      },

      updateQuantity: (cartKey: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(cartKey);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.cartKey === cartKey
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);