// app/checkout/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { OrderForm } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderForm>({
    defaultValues: {
      paymentMethod: 'card',
    },
  });

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08; // %8 KDV
  const total = subtotal + tax;

  const onSubmit = async (data: OrderForm) => {
    try {
      setIsSubmitting(true);

      const orderData = {
        items,
        subtotal,
        tax,
        total,
        ...data,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Siparişiniz alındı!');
        clearCart();
        router.push(`/orders/${result.data.id}`);
      } else {
        toast.error(result.error || 'Sipariş oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Sipariş oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header 
        onMenuToggle={() => {}}
        currentStep="payment"
        onStepChange={(step) => {
          if (step === 'order') router.push('/');
          if (step === 'cart') router.push('/cart');
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Ödeme</h1>
          <p className="text-white/80">
            Siparişinizi tamamlamak için ödeme bilgilerinizi girin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-6">Ödeme Yöntemi</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-300">
                  <input 
                    type="radio" 
                    value="card" 
                    {...register('paymentMethod')}
                    className="w-5 h-5 text-orange-500" 
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Kredi/Banka Kartı</div>
                    <div className="text-white/70 text-sm">Güvenli ödeme ile hemen sipariş verin</div>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>
                
                <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-300">
                  <input 
                    type="radio" 
                    value="cash" 
                    {...register('paymentMethod')}
                    className="w-5 h-5 text-orange-500" 
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Kapıda Nakit</div>
                    <div className="text-white/70 text-sm">Teslimat sırasında nakit ödeme</div>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
                
                <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-300">
                  <input 
                    type="radio" 
                    value="online" 
                    {...register('paymentMethod')}
                    className="w-5 h-5 text-orange-500" 
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Online Cüzdan</div>
                    <div className="text-white/70 text-sm">Papara, Tosla veya diğer cüzdanlar</div>
                  </div>
                  <span className="text-2xl">📱</span>
                </label>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-6">Teslimat Bilgileri</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    {...register('phone', {
                      required: 'Telefon numarası gerekli',
                      pattern: {
                        value: /^[0-9+\-\s()]+$/,
                        message: 'Geçerli bir telefon numarası girin',
                      },
                    })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="0555 123 45 67"
                  />
                  {errors.phone && (
                    <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Adres
                  </label>
                  <textarea
                    {...register('address.fullAddress', {
                      required: 'Adres gerekli',
                      minLength: {
                        value: 10,
                        message: 'Adres en az 10 karakter olmalıdır',
                      },
                    })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                    placeholder="Tam adresinizi girin..."
                  />
                  {errors.address?.fullAddress && (
                    <p className="text-red-300 text-sm mt-1">{errors.address.fullAddress.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Note */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-6">Sipariş Notu</h3>
              
              <textarea 
                {...register('orderNote')}
                placeholder="Siparişiniz ile ilgili özel bir isteğiniz varsa buraya yazabilirsiniz..."
                className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:border-white/40 transition-colors duration-300"
              />
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 sticky top-24">
              <h3 className="text-white text-xl font-semibold mb-6">Sipariş Özeti</h3>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.cartKey} className="flex justify-between text-white/80 text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pt-4 border-t border-white/20">
                <div className="flex justify-between text-white/80">
                  <span>Ara Toplam:</span>
                  <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>KDV (%8):</span>
                  <span>{tax.toFixed(2)} ₺</span>
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
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sipariş Veriliyor...' : 'Siparişi Tamamla'}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="text-white/70 hover:text-white text-sm transition-colors duration-300"
                >
                  ← Sepete Dön
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}   