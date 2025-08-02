// app/cart/page.tsx
'use client';

import { useState } from 'react';
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
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalPrice,
    appliedCoupon,
    getDiscountAmount
  } = useCartStore();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getTotalPrice();
  const discount: number = getDiscountAmount() as number;
  const total = subtotal - discount;

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Kupon kodu girin');
      return;
    }

    try {
      setCouponLoading(true);
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          orderTotal: subtotal
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Note: You need to implement setAppliedCoupon in your cart store
        // For now, this will cause an error - implement it in @/store/cart
        toast.success('Kupon başarıyla uygulandı!');
      } else {
        toast.error(result.message || 'Geçersiz kupon kodu');
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error('Kupon doğrulanırken hata oluştu');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    // Note: You need to implement setAppliedCoupon in your cart store
    // For now, this will cause an error - implement it in @/store/cart
    setCouponCode('');
    toast.success('Kupon kaldırıldı');
  };

  // Define the CheckoutFormData type above the component or import it if it exists elsewhere
  type CheckoutFormData = {
    phone: string;
    paymentMethod: string;
    orderNote?: string;
    fullAddress: string;
    addressDetails?: string;
    // Add other fields as needed
  };
  
    const onSubmit = async (data: CheckoutFormData) => {
      const orderData = {
        items,
        subtotal: total,
        tax: 0,
        total,
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        orderNote: data.orderNote || '',
        deliveryAddress: {
          address: data.fullAddress,
          coordinates: {
            lat: 0, // Replace 0 with the correct latitude value
            lng: 0  // Replace 0 with the correct longitude value
          },
          details: data.addressDetails || ''
        },
        appliedCoupon: appliedCoupon, // Kupon bilgisini ekle
        discountAmount: discount // İndirim miktarını ekle
      };
  
      // ...existing code...
    };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header 
        onMenuToggle={() => {}}
        currentStep="cart"
        onStepChange={(step) => console.log('Step changed:', step)}
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
                <CartItem
                  key={item.cartKey}
                  item={{
                    ...item,
                    id: item.productId, // or provide the correct id
                    description: '', // fill with actual description if available
                    categories: [] as string[], // fill with actual categories if available
                    discount: 0, // fill with actual discount if available
                    tags: [] as string[], // default empty array
                    hasOptions: false, // default value
                    options: [] as string[], // default empty array
                    isActive: true, // default value
                    stock: 0, // default value, adjust as needed
                    createdAt: new Date().toISOString(), // or use actual value if available
                    updatedAt: new Date().toISOString(), // or use actual value if available
                  }}
                />
              ))}
            </div>

            {/* Coupon Section */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">İndirim Kuponu</h3>
              
              {!appliedCoupon ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Kupon kodunu girin..."
                    maxLength={20}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Uygula'
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-400 font-medium">✅ {appliedCoupon.name}</div>
                      <div className="text-green-300 text-sm">
                        Kod: {appliedCoupon.code} • 
                        {appliedCoupon.type === 'percentage' 
                          ? ` %${appliedCoupon.value} İndirim`
                          : ` ${appliedCoupon.value}₺ İndirim`
                        }
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Sipariş Özeti</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Ara Toplam:</span>
                  <span>{(subtotal || 0).toFixed(2)} ₺</span>
                </div>
                
                {appliedCoupon && discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>İndirim ({appliedCoupon.code}):</span>
                    <span>-{(discount || 0).toFixed(2)} ₺</span>
                  </div>
                )}
                
                <div className="flex justify-between text-white/80">
                  <span>Teslimat:</span>
                  <span className="text-green-400">Ücretsiz</span>
                </div>
                
                <div className="h-px bg-white/20"></div>
                
                <div className="flex justify-between text-white text-xl font-bold">
                  <span>Toplam:</span>
                  <span>{(total || 0).toFixed(2)} ₺</span>
                </div>
                
                {appliedCoupon && discount > 0 && (
                  <div className="text-green-400 text-sm text-center">
                    🎉 {(discount || 0).toFixed(2)} ₺ tasarruf ettiniz!
                  </div>
                )}
              </div>

              <Link
                href="/checkout"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 text-lg mt-6 block text-center"
              >
                Siparişi Tamamla
              </Link>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

import Link from 'next/link';

/* useCartStore is imported from '@/store/cart' */

// Define CartItemType if not already imported
type CartItemType = {
  cartKey: string;
  productId: string | number;
  quantity: number;
  // Add other fields as needed based on your application's requirements
};

// Define CouponType if not already imported
type CouponType = {
  code: string;
  name: string;
  type: 'percentage' | 'amount';
  value: number;
  // Add other fields as needed
};

export interface CartStore {
  items: CartItemType[];
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  appliedCoupon: CouponType | null;
  setAppliedCoupon: (coupon: CouponType | null) => void;
  getDiscountAmount: () => number;
}

// Make sure setAppliedCoupon is implemented in your cart store logic (e.g., in /store/cart.ts)