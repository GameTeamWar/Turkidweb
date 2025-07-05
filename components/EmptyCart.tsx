// components/EmptyCart.tsx
'use client';

import Link from 'next/link';

export function EmptyCart() {
  return (
    <div className="text-center py-16 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
      <div className="text-8xl mb-6">🛒</div>
      <h2 className="text-white text-2xl font-bold mb-4">Sepetiniz boş</h2>
      <p className="text-white/70 mb-8 max-w-md mx-auto">
        Henüz sepetinizde ürün bulunmuyor. Lezzetli yemeklerimizi keşfedin ve sipariş vermeye başlayın!
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5"
      >
        <span>🍔</span>
        Alışverişe Başla
      </Link>
    </div>
  );
}