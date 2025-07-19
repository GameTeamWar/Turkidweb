// app/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, ApiResponse } from '@/types';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

interface OrderDetailPageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchOrder();
    
    // Auto-refresh order every 15 seconds for active orders
    const interval = setInterval(() => {
      if (order && !['delivered', 'cancelled'].includes(order.status)) {
        fetchOrder(false);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [session, status, router, params.id]);

  const fetchOrder = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const response = await fetch(`/api/orders/${params.id}`);
      const result: ApiResponse<Order> = await response.json();
      
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        toast.error(result.error || 'Sipariş bulunamadı');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Sipariş yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'from-yellow-500 to-yellow-600';
      case 'confirmed': return 'from-blue-500 to-blue-600';
      case 'preparing': return 'from-orange-500 to-orange-600';
      case 'ready': return 'from-purple-500 to-purple-600';
      case 'out_for_delivery': return 'from-indigo-500 to-indigo-600';
      case 'delivered': return 'from-green-500 to-green-600';
      case 'cancelled': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Sipariş Alındı';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'out_for_delivery': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-6 h-6" />;
      case 'confirmed': return <CheckCircleIcon className="w-6 h-6" />;
      case 'preparing': return <ClockIcon className="w-6 h-6" />;
      case 'ready': return <CheckCircleIcon className="w-6 h-6" />;
      case 'out_for_delivery': return <TruckIcon className="w-6 h-6" />;
      case 'delivered': return <CheckCircleIcon className="w-6 h-6" />;
      case 'cancelled': return <XCircleIcon className="w-6 h-6" />;
      default: return <ClockIcon className="w-6 h-6" />;
    }
  };

  const getProgressSteps = () => {
    return [
      { key: 'pending', label: 'Sipariş Alındı', icon: '📝' },
      { key: 'confirmed', label: 'Onaylandı', icon: '✅' },
      { key: 'preparing', label: 'Hazırlanıyor', icon: '👨‍🍳' },
      { key: 'ready', label: 'Hazır', icon: '🍽️' },
      { key: 'out_for_delivery', label: 'Yolda', icon: '🚗' },
      { key: 'delivered', label: 'Teslim Edildi', icon: '🎉' }
    ];
  };

  const getCurrentStepIndex = (status: Order['status']) => {
    const steps = getProgressSteps();
    return steps.findIndex(step => step.key === status);
  };

  const getEstimatedDeliveryText = () => {
    if (!order) return '';
    
    if (order.status === 'delivered') {
      return 'Siparişiniz teslim edildi!';
    }
    if (order.status === 'cancelled') {
      return 'Sipariş iptal edildi';
    }
    if (order.estimatedDeliveryTime) {
      const deliveryTime = new Date(order.estimatedDeliveryTime);
      const now = new Date();
      if (deliveryTime > now) {
        return `Tahmini ${formatDistanceToNow(deliveryTime, { locale: tr })} içinde teslim`;
      }
    }
    return 'Teslimat zamanı hesaplanıyor...';
  };

  const canCancelOrder = () => {
    return order && ['pending', 'confirmed'].includes(order.status);
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sipariş iptal edildi');
        fetchOrder();
      } else {
        toast.error(result.error || 'Sipariş iptal edilirken hata oluştu');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Sipariş iptal edilirken hata oluştu');
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
        <Header onMenuToggle={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-8xl mb-6">❌</div>
            <h2 className="text-white text-2xl font-bold mb-4">Sipariş bulunamadı</h2>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Siparişlerime Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);
  const steps = getProgressSteps();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header onMenuToggle={() => {}} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/orders"
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-white text-3xl font-bold">Sipariş #{order.orderNumber}</h1>
                <p className="text-white/80">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: tr })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white font-bold text-3xl">{order.total.toFixed(2)} ₺</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-400 text-sm">●</span>
                <span className="text-green-400 text-sm">Ödendi</span>
              </div>
            </div>
          </div>
          
          {refreshing && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-blue-300 text-sm">Sipariş durumu güncelleniyor...</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="mb-6">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-lg bg-gradient-to-r ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
                <p className="text-white/80 mt-3 text-lg">
                  {getEstimatedDeliveryText()}
                </p>
              </div>

              {/* Progress Steps */}
              {order.status !== 'cancelled' && (
                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-500 scale-110' 
                            : isCurrent 
                              ? 'bg-orange-500 scale-105 animate-pulse' 
                              : 'bg-white/20'
                        }`}>
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium ${
                            isCompleted ? 'text-green-300' : isCurrent ? 'text-orange-300' : 'text-white/60'
                          }`}>
                            {step.label}
                          </div>
                          {isCurrent && order.status !== 'delivered' && (
                            <div className="text-white/70 text-sm mt-1">
                              Şu anda bu aşamada...
                            </div>
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-white/20'} transition-colors duration-300`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cancel Order Button */}
              {canCancelOrder() && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <button
                    onClick={handleCancelOrder}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Siparişi İptal Et
                  </button>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6" />
                Sipariş İçeriği
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors duration-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">{item.name}</h4>
                        {item.selectedOptions && Object.values(item.selectedOptions).length > 0 && (
                          <div className="text-white/70 text-sm mt-1">
                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                              <span key={key} className="inline-block bg-white/20 rounded-full px-2 py-1 mr-2 mb-1">
                                {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-6 mt-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">Adet:</span>
                            <span className="text-white font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">Birim Fiyat:</span>
                            <span className="text-white font-medium">{item.price.toFixed(2)} ₺</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-xl">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPinIcon className="w-6 h-6" />
                  Teslimat Adresi
                </h3>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/20 rounded-full p-3">
                      <MapPinIcon className="w-6 h-6 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-lg">
                        {typeof order.deliveryAddress === 'string' 
                          ? order.deliveryAddress 
                          : order.deliveryAddress.address}
                      </p>
                      {typeof order.deliveryAddress === 'object' && order.deliveryAddress.details && (
                        <p className="text-white/70 mt-2">
                          {order.deliveryAddress.details}
                        </p>
                      )}
                      {order.phone && (
                        <div className="flex items-center gap-3 mt-4">
                          <PhoneIcon className="w-5 h-5 text-white/60" />
                          <span className="text-white">{order.phone}</span>
                          <a
                            href={`tel:${order.phone}`}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300"
                          >
                            Ara
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {typeof order.deliveryAddress === 'object' && order.deliveryAddress.coordinates && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <button
                        onClick={() => {
                          const coords = order.deliveryAddress as any;
                          window.open(`https://maps.google.com?q=${coords.coordinates.lat},${coords.coordinates.lng}`, '_blank');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                      >
                        Haritada Göster
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Note */}
            {order.orderNote && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">Sipariş Notu</h3>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-white">{order.orderNote}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 sticky top-24">
              <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                <CurrencyDollarIcon className="w-6 h-6" />
                Ödeme Özeti
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-white/80">
                  <span>Ara Toplam:</span>
                  <span>{order.subtotal.toFixed(2)} ₺</span>
                </div>
                
                {order.tax > 0 && (
                  <div className="flex justify-between text-white/80">
                    <span>KDV (%8):</span>
                    <span>{order.tax.toFixed(2)} ₺</span>
                  </div>
                )}
                
                {order.appliedCoupon && order.discountAmount > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex justify-between text-green-400 mb-2">
                      <span>İndirim Kuponu:</span>
                      <span>-{order.discountAmount.toFixed(2)} ₺</span>
                    </div>
                    <div className="text-green-300 text-sm">
                      🎉 Kod: {order.appliedCoupon.code}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-white/80">
                  <span>Teslimat:</span>
                  <span className="text-green-400">Ücretsiz</span>
                </div>
                
                <div className="h-px bg-white/20"></div>
                
                <div className="flex justify-between text-white text-xl font-bold">
                  <span>Toplam:</span>
                  <span>{order.total.toFixed(2)} ₺</span>
                </div>
                
                <div className="text-center pt-4 border-t border-white/20">
                  <div className="text-white/70 text-sm mb-2">Ödeme Yöntemi</div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <span className="text-white font-medium">
                      {order.paymentMethod === 'card' ? '💳 Kredi Kartı' : 
                       order.paymentMethod === 'cash' ? '💵 Nakit' : 
                       '📱 Online Ödeme'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-4">İletişim</h3>
              <div className="space-y-3">
                <a
                  href="tel:+905551234567"
                  className="flex items-center gap-3 bg-green-500/20 hover:bg-green-500/30 p-3 rounded-lg transition-colors duration-300"
                >
                  <PhoneIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Restoran</div>
                    <div className="text-white/70 text-sm">+90 555 123 45 67</div>
                  </div>
                </a>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-white/70 text-sm">Sipariş ID</div>
                  <div className="text-white font-mono">{order.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}