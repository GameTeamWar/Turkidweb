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
    if (!options) return null;
    
    const optionTexts = [];
    if (options.spice) {
      optionTexts.push(options.spice === 'baharatli' ? 'Baharatlı' : 'Baharatsız');
    }
    if (options.sauce) {
      optionTexts.push(
        options.sauce === 'ketcap' ? 'Ketçap' :
        options.sauce === 'mayonez' ? 'Mayonez' : 'Sos İstemiyorum'
      );
    }
    
    return optionTexts.join(' • ');
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:bg-white/15">
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-lg font-semibold mb-1 truncate">{item.name}</h4>
          
          {item.selectedOptions && (
            <div className="text-white/70 text-sm mb-2">
              {formatOptions(item.selectedOptions)}
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            <span className="text-white font-bold text-lg">{item.price.toFixed(2)} ₺</span>
            {item.originalPrice && (
              <span className="text-white/60 line-through text-sm">
                {item.originalPrice.toFixed(2)} ₺
              </span>
            )}
            {item.discount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                %{item.discount}
              </span>
            )}
          </div>

          <div className="text-white/80 text-sm">
            Toplam: <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} ₺</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 hover:scale-110"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          
          <span className="text-white font-semibold text-lg min-w-[40px] text-center">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 hover:scale-110"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => removeItem(item.cartKey)}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg ml-2 transition-all duration-300 hover:scale-105"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}