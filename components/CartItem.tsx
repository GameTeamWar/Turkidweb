// components/CartItem.tsx
'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { CartItem as CartItemType } from '@/types';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(item.cartKey);
    } else {
      updateQuantity(item.cartKey, newQuantity);
    }
  };

  const formatOptions = (options?: Record<string, string>) => {
    if (!options || Object.keys(options).length === 0) return null;
    
    return Object.entries(options)
      .filter(([key, value]) => value && value.trim())
      .map(([key, value]) => {
        // Option name ve value'yu güzel formatlama
        const optionName = key.charAt(0).toUpperCase() + key.slice(1);
        return `${optionName}: ${value}`;
      })
      .join(' • ');
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:bg-white/15">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{item.name}</h3>
          
          {/* Options Display */}
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
            <div className="mb-2">
              <div className="text-orange-300 text-sm font-medium mb-1">Seçenekler:</div>
              <div className="text-white/70 text-sm bg-white/10 rounded-md px-2 py-1">
                {formatOptions(item.selectedOptions)}
              </div>
            </div>
          )}

          {/* Price and Quantity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{item.price.toFixed(2)} ₺</span>
              <span className="text-white/60 text-sm">× {item.quantity}</span>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center font-bold transition-colors duration-300"
              >
                −
              </button>
              
              <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
              
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 flex items-center justify-center font-bold transition-colors duration-300"
              >
                +
              </button>
              
              <button
                onClick={() => removeItem(item.cartKey)}
                className="ml-2 w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors duration-300"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Total for this item */}
          <div className="mt-2 text-right">
            <span className="text-orange-400 font-bold">
              Toplam: {(item.price * item.quantity).toFixed(2)} ₺
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}