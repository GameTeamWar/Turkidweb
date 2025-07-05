// components/CartBadge.tsx
'use client';

import { useCartStore } from '@/store/cart';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface CartBadgeProps {
  onClick: () => void;
}

export function CartBadge({ onClick }: CartBadgeProps) {
  const { getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
    >
      <div className="relative">
        <ShoppingCartIcon className="w-8 h-8" />
        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {totalItems}
        </div>
      </div>
      <div className="text-xs mt-1 font-medium">
        {totalPrice.toFixed(2)} ₺
      </div>
    </button>
  );
}