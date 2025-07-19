// app/orders/page.tsx
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
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchOrders();
    
    // Auto-refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const result: ApiResponse<Order[]> = await response.json();
      
      if (result.success) {
        setOrders(result.data || []);
      } else {
        toast.error(result.error || 'Siparişler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'preparing': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'ready': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'out_for_delivery': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'confirmed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'preparing': return <ClockIcon className="w-5 h-5" />;
      case 'ready': return <CheckCircleIcon className="w-5 h-5" />;
      case 'out_for_delivery': return <TruckIcon className="w-5 h-5" />;
      case 'delivered': return <CheckCircleIcon className="w-5 h-5" />;
      case 'cancelled': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getProgressPercentage = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 25;
      case 'preparing': return 50;
      case 'ready': return 75;
      case 'out_for_delivery': return 90;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getEstimatedDeliveryText = (order: Order) => {
    if (order.status === 'delivered') {
      return 'Teslim edildi';
    }
    if (order.status === 'cancelled') {
      return 'İptal edildi';
    }
    if (order.estimatedDeliveryTime) {
      const deliveryTime = new Date(order.estimatedDeliveryTime);
      const now = new Date();
      if (deliveryTime > now) {
        return `Tahmini ${formatDistanceToNow(deliveryTime, { locale: tr })} içinde`;
      }
    }
    return 'Teslimat zamanı hesaplanıyor...';
  };

  const canCancelOrder = (order: Order) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sipariş iptal edildi');
        fetchOrders();
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

  // Group orders by status
  const activeOrders = orders.filter(order => 
    !['delivered', 'cancelled'].includes(order.status)
  );
  const completedOrders = orders.filter(order => 
    ['delivered', 'cancelled'].includes(order.status)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header onMenuToggle={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Siparişlerim</h1>
              <p className="text-white/80">
                Toplam {orders.length} sipariş • {activeOrders.length} aktif
              </p>
            </div>
            <Link
              href="/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
            >
              Yeni Sipariş Ver
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
            <div className="text-8xl mb-6">📋</div>
            <h2 className="text-white text-2xl font-bold mb-4">Henüz sipariş vermediniz</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Lezzetli yemeklerimizi keşfedin ve ilk siparişinizi verin!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>🍔</span>
              Sipariş Vermeye Başla
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-white" />
                  </div>
                  Aktif Siparişler
                </h2>
                <div className="space-y-6">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-white text-xl font-bold mb-2">
                            Sipariş #{order.orderNumber}
                          </h3>
                          <p className="text-white/70 text-sm">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-2xl">{order.total.toFixed(2)} ₺</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/70 text-sm">{order.paymentMethod}</span>
                            <span className="text-green-400 text-sm">●</span>
                            <span className="text-green-400 text-sm">Ödendi</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-white/70 text-sm">
                            {getEstimatedDeliveryText(order)}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgressPercentage(order.status)}%` }}
                          />
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-6 p-4 bg-white/10 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Sipariş Detayları</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-white">
                                {item.quantity}x {item.name}
                                {item.selectedOptions && Object.values(item.selectedOptions).length > 0 && (
                                  <span className="text-white/60"> ({Object.values(item.selectedOptions).join(', ')})</span>
                                )}
                              </span>
                              <span className="text-white/80">{(item.price * item.quantity).toFixed(2)} ₺</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      {order.deliveryAddress && (
                        <div className="mb-6 p-4 bg-white/10 rounded-lg">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            Teslimat Adresi
                          </h4>
                          <p className="text-white/80 text-sm">
                            {typeof order.deliveryAddress === 'string' 
                              ? order.deliveryAddress 
                              : order.deliveryAddress.address}
                          </p>
                          {order.phone && (
                            <div className="flex items-center gap-2 mt-2">
                              <PhoneIcon className="w-4 h-4 text-white/60" />
                              <span className="text-white/80 text-sm">{order.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Note */}
                      {order.orderNote && (
                        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="text-blue-300 font-medium mb-2">Sipariş Notu</h4>
                          <p className="text-white/80 text-sm">{order.orderNote}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-2 transition-colors duration-300"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Detayları Gör
                          </button>
                          {order.phone && (
                            <a
                              href={`tel:${order.phone}`}
                              className="text-green-400 hover:text-green-300 font-medium text-sm flex items-center gap-2 transition-colors duration-300"
                            >
                              <PhoneIcon className="w-4 h-4" />
                              Restoran
                            </a>
                          )}
                        </div>
                        
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                          >
                            Siparişi İptal Et
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  Geçmiş Siparişler
                </h2>
                <div className="space-y-4">
                  {completedOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Sipariş #{order.orderNumber}</h4>
                          <p className="text-white/60 text-sm">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{order.total.toFixed(2)} ₺</div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {completedOrders.length > 5 && (
                    <div className="text-center py-4">
                      <button className="text-white/70 hover:text-white text-sm underline">
                        Daha fazla göster ({completedOrders.length - 5} sipariş daha)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-300';
      case 'confirmed': return 'text-blue-300';
      case 'preparing': return 'text-orange-300';
      case 'ready': return 'text-purple-300';
      case 'out_for_delivery': return 'text-indigo-300';
      case 'delivered': return 'text-green-300';
      case 'cancelled': return 'text-red-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Sipariş Detayları</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors duration-300"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm">Sipariş No</label>
              <div className="text-white font-bold text-lg">{order.orderNumber}</div>
            </div>
            <div>
              <label className="text-white/70 text-sm">Sipariş Tarihi</label>
              <div className="text-white font-medium">
                {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm">Durum</label>
              <div className={`font-medium ${getStatusColor(order.status)}`}>
                {order.status === 'pending' && 'Sipariş Alındı'}
                {order.status === 'confirmed' && 'Onaylandı'}
                {order.status === 'preparing' && 'Hazırlanıyor'}
                {order.status === 'ready' && 'Hazır'}
                {order.status === 'out_for_delivery' && 'Yolda'}
                {order.status === 'delivered' && 'Teslim Edildi'}
                {order.status === 'cancelled' && 'İptal Edildi'}
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm">Toplam Tutar</label>
              <div className="text-white font-bold text-lg">{order.total.toFixed(2)} ₺</div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-white font-semibold mb-3">Sipariş İçeriği</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="text-white font-medium">{item.name}</h5>
                      {item.selectedOptions && Object.values(item.selectedOptions).length > 0 && (
                        <p className="text-white/60 text-sm mt-1">
                          {Object.values(item.selectedOptions).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-white/70">Adet: {item.quantity}</span>
                        <span className="text-white/70">Birim: {item.price.toFixed(2)} ₺</span>
                      </div>
                    </div>
                    <div className="text-white font-bold">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h4 className="text-white font-semibold mb-3">Ödeme Detayları</h4>
            <div className="bg-white/10 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Ara Toplam:</span>
                <span className="text-white">{order.subtotal.toFixed(2)} ₺</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/70">KDV:</span>
                  <span className="text-white">{order.tax.toFixed(2)} ₺</span>
                </div>
              )}
              {order.appliedCoupon && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>İndirim ({order.appliedCoupon.code}):</span>
                  <span>-{order.discountAmount.toFixed(2)} ₺</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Toplam:</span>
                  <span className="text-white">{order.total.toFixed(2)} ₺</span>
                </div>
              </div>
              <div className="text-sm text-white/70">
                Ödeme Yöntemi: {order.paymentMethod === 'card' ? 'Kredi Kartı' : order.paymentMethod === 'cash' ? 'Nakit' : 'Online Ödeme'}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div>
              <h4 className="text-white font-semibold mb-3">Teslimat Adresi</h4>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-white/60 mt-1" />
                  <div>
                    <p className="text-white">
                      {typeof order.deliveryAddress === 'string' 
                        ? order.deliveryAddress 
                        : order.deliveryAddress.address}
                    </p>
                    {typeof order.deliveryAddress === 'object' && order.deliveryAddress.details && (
                      <p className="text-white/70 text-sm mt-1">
                        {order.deliveryAddress.details}
                      </p>
                    )}
                  </div>
                </div>
                {order.phone && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
                    <PhoneIcon className="w-5 h-5 text-white/60" />
                    <span className="text-white">{order.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Note */}
          {order.orderNote && (
            <div>
              <h4 className="text-white font-semibold mb-3">Sipariş Notu</h4>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-white">{order.orderNote}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}