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
        const optionsKey = options ? JSON.stringify(options) : '';
        const itemId = `${product.id}_${optionsKey}`;
        
        // Toplam opsiyon fiyatını hesapla
        let optionsPrice = 0;
        if (options && product.optionsData) {
          Object.entries(options).forEach(([optionName, choiceNames]) => {
            const option = product.optionsData.find(opt => opt.name === optionName);
            if (option) {
              // Çoklu seçim kontrolü
              if (option.type === 'checkbox' && choiceNames.includes(',')) {
                const selectedChoiceNames = choiceNames.split(', ');
                selectedChoiceNames.forEach(choiceName => {
                  const choice = option.choices.find(c => c.name === choiceName);
                  if (choice) optionsPrice += choice.price;
                });
              } else {
                // Tek seçim
                const choice = option.choices.find(c => c.name === choiceNames);
                if (choice) optionsPrice += choice.price;
              }
            }
          });
        }
        
        const totalPrice = product.price + optionsPrice;
        
        set((state) => {
          const existingItem = state.items.find(item => item.id === itemId);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === itemId
                  ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * totalPrice }
                  : item
              ),
            };
          } else {
            const newItem: CartItem = {
              id: itemId,
              name: product.name,
              price: totalPrice, // Opsiyonlar dahil fiyat
              image: product.image,
              quantity: 1,
              selectedOptions: options,
              totalPrice: totalPrice,
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



