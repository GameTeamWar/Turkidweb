// store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartStore, Product, CartItem } from '@/types';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null, // Yeni alan

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
        set({ 
          items: [],
          appliedCoupon: null // Kupon da temizlensin
        });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      setAppliedCoupon: (coupon) => set((state) => ({ ...state, appliedCoupon: coupon })),

      getDiscountAmount: () => {
        const { appliedCoupon } = get();
        if (!appliedCoupon) return 0;

        const subtotal = get().getTotalPrice();
        
        if (appliedCoupon.type === 'percentage') {
          const discount = subtotal * (appliedCoupon.value / 100);
          return Math.min(discount, appliedCoupon.maxDiscountAmount || Infinity);
        } else {
          return Math.min(appliedCoupon.value, subtotal);
        }
      },

      getFinalTotal: () => {
        const subtotal = Number(get().getTotalPrice()) || 0;
        const discount = Number(get().getDiscountAmount()) || 0;
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, appliedCoupon: state.appliedCoupon }),
    }
  )
);

