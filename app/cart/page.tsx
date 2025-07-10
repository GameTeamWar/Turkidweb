// app/cart/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import { Header } from '@/components/Header';
import { CartItem } from '@/components/CartItem';
import { EmptyCart } from '@/components/EmptyCart';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();

  const subtotal = getTotalPrice();
  const total = subtotal; // KDV kaldırıldı, toplam subtotal ile aynı

  const handleCheckout = () => {
    if (!session) {
      toast.error('Ödeme için giriş yapmanız gerekiyor');
      router.push('/auth/signin');
      return;
    }

    if (items.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (confirm('Sepeti temizlemek istediğinizden emin misiniz?')) {
      clearCart();
      toast.success('Sepet temizlendi');
    }
  };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header 
        onMenuToggle={() => {}}
        currentStep="cart"
        onStepChange={(step) => {
          if (step === 'order') router.push('/');
          if (step === 'payment') handleCheckout();
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Sepetim</h1>
          <p className="text-white/80">
            {items.length} ürün • Toplam: {total.toFixed(2)} ₺
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem key={item.cartKey} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 sticky top-24">
                <h3 className="text-white text-xl font-semibold mb-6">Sipariş Özeti</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-white/80">
                    <span>Ara Toplam:</span>
                    <span>{subtotal.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Teslimat:</span>
                    <span className="text-green-400 font-medium">Ücretsiz</span>
                  </div>
                  <div className="h-px bg-white/20"></div>
                  <div className="flex justify-between text-white text-xl font-bold">
                    <span>Toplam:</span>
                    <span>{total.toFixed(2)} ₺</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 text-lg"
                  >
                    Ödemeye Geç
                  </button>
                  
                  <button
                    onClick={handleClearCart}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300"
                  >
                    Sepeti Temizle
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-white/80 hover:text-white py-2 text-center transition-colors duration-300"
                  >
                    ← Alışverişe Devam Et
                  </button>
                </div>

                {/* Promo Code */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="İndirim kodu"
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:border-white/50"
                    />
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
                      Uygula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}