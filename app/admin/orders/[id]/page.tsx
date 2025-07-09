// app/admin/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Order, ApiResponse } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [session, status, router, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching order:', orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<Order> = await response.json();
      console.log('📋 API Result:', result);
      
      if (result.success && result.data) {
        setOrder(result.data);
        console.log('✅ Order loaded successfully');
      } else {
        console.error('❌ API returned error:', result.error);
        toast.error(result.error || 'Sipariş bulunamadı');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('❌ Fetch order error:', error);
      toast.error('Sipariş yüklenirken hata oluştu');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;

    if (!confirm(`Sipariş durumunu "${getStatusText(newStatus)}" olarak güncellemek istediğinizden emin misiniz?`)) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          updatedBy: session?.user?.name || 'Admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Sipariş durumu güncellendi');
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        toast.error(result.error || 'Sipariş durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Sipariş durumu güncellenirken hata oluştu');
    } finally {
      setUpdating(false);
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
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'out_for_delivery': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
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

  const getNextStatuses = (currentStatus: Order['status']): Order['status'][] => {
    switch (currentStatus) {
      case 'pending': return ['confirmed', 'cancelled'];
      case 'confirmed': return ['preparing', 'cancelled'];
      case 'preparing': return ['ready', 'cancelled'];
      case 'ready': return ['out_for_delivery', 'delivered'];
      case 'out_for_delivery': return ['delivered'];
      default: return [];
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-white text-xl font-semibold mb-2">Sipariş bulunamadı</h3>
        <p className="text-white/60 mb-6">Bu sipariş mevcut değil veya silinmiş olabilir</p>
        <Link
          href="/admin/orders"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Siparişlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Sipariş Detayı</h1>
            <p className="text-white/70 mt-1">#{order.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-semibold text-lg">{getStatusText(order.status)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getNextStatuses(order.status).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 disabled:opacity-50 ${
                  status === 'cancelled' 
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {updating ? 'Güncelleniyor...' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Müşteri Bilgileri
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60">Ad Soyad:</span>
              <span className="text-white font-medium">{order.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Email:</span>
              <span className="text-white font-medium">{order.userEmail}</span>
            </div>
            {order.phone && (
              <div className="flex justify-between">
                <span className="text-white/60">Telefon:</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" />
                  {order.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5" />
            Sipariş Özeti
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-white/80">
              <span>Toplam:</span>
              <span className="text-white text-xl font-bold">{order.total.toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Ödeme:</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Durum:</span>
              <span className="capitalize">{order.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Sipariş Ürünleri</h3>
        
        <div className="space-y-4">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="text-white font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-white/60 text-sm">{item.description}</div>
                  )}
                </div>
                <div className="text-center mx-4">
                  <div className="text-white font-medium">x{item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{item.price.toFixed(2)} ₺</div>
                  <div className="text-white/60 text-sm">{(item.price * item.quantity).toFixed(2)} ₺</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-white/60 text-center py-4">
              Sipariş ürünleri yüklenemedi
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" />
            Teslimat Adresi
          </h3>
          
          <div className="space-y-2">
            <div className="text-white font-medium">{order.address.title}</div>
            <div className="text-white/80">{order.address.fullAddress}</div>
          </div>
        </div>
      )}

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}