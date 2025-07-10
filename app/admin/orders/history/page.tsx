// app/admin/orders/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, ApiResponse } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

interface HistoryOrder extends Order {
  movedToHistoryAt?: string;
  movedBy?: string;
  historyDate?: string;
  originalOrderId?: string;
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchOrderHistory();
  }, [session, status, router, selectedDate, filters]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (selectedDate) queryParams.append('date', selectedDate);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/admin/orders/history?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<HistoryOrder[]> = await response.json();
      
      if (result.success) {
        setOrders(result.data || []);
      } else {
        toast.error(result.error || 'Geçmiş siparişler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch order history error:', error);
      // API endpoint yoksa mock data kullan
      setOrders([]);
      toast.error('Geçmiş sipariş API\'si bulunamadı. Lütfen backend\'i kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (orders.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı');
      return;
    }

    const csvData = orders.map(order => ({
      'Sipariş No': order.orderNumber,
      'Müşteri': order.userName,
      'Email': order.userEmail,
      'Tutar': `${order.total}₺`,
      'Durum': getStatusText(order.status),
      'Ödeme': order.paymentMethod,
      'Sipariş Tarihi': new Date(order.createdAt).toLocaleDateString('tr-TR'),
      'Geçmişe Taşındı': order.movedToHistoryAt ? new Date(order.movedToHistoryAt).toLocaleDateString('tr-TR') : '-'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siparis-gecmisi-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(search) ||
        order.userName.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search)
      );
    }
    if (filters.status && order.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'confirmed': return 'bg-blue-500/20 text-blue-300';
      case 'preparing': return 'bg-orange-500/20 text-orange-300';
      case 'ready': return 'bg-purple-500/20 text-purple-300';
      case 'out_for_delivery': return 'bg-indigo-500/20 text-indigo-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Bekleyen';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'out_for_delivery': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  // İstatistikler
  const stats = {
    totalOrders: filteredOrders.length,
    deliveredOrders: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length,
    totalRevenue: filteredOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
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
                <h1 className="text-3xl font-bold text-white">Sipariş Geçmişi</h1>
                <p className="text-white/70 mt-1">
                  {selectedDate} - {filteredOrders.length} sipariş
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCsv}
                disabled={filteredOrders.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                CSV İndir
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-blue-300" />
                <div>
                  <p className="text-blue-300 text-sm font-medium">Toplam Sipariş</p>
                  <p className="text-white text-xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-green-300" />
                <div>
                  <p className="text-green-300 text-sm font-medium">Teslim Edildi</p>
                  <p className="text-white text-xl font-bold">{stats.deliveredOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-red-300" />
                <div>
                  <p className="text-red-300 text-sm font-medium">İptal Edildi</p>
                  <p className="text-white text-xl font-bold">{stats.cancelledOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Toplam Gelir</p>
                  <p className="text-white text-xl font-bold">{stats.totalRevenue.toFixed(2)} ₺</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-white/60" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
                />
              </div>
              
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Sipariş no, müşteri adı veya email ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal</option>
                  <option value="pending">Bekleyen</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="preparing">Hazırlanıyor</option>
                  <option value="ready">Hazır</option>
                  <option value="out_for_delivery">Yolda</option>
                </select>
                
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
                  placeholder="Başlangıç tarihi"
                />
                
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
                  placeholder="Bitiş tarihi"
                />
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id || order.originalOrderId}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-white font-semibold text-lg">#{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="text-white/80 text-sm mb-2">
                      {order.userName} • {order.userEmail}
                    </div>
                    
                    <div className="text-white/60 text-sm mb-2">
                      Sipariş: {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {order.movedToHistoryAt && (
                        <>
                          {' • '}
                          Geçmişe taşındı: {formatDistanceToNow(new Date(order.movedToHistoryAt), { addSuffix: true, locale: tr })}
                        </>
                      )}
                    </div>

                    {/* Delivery Info */}
                    {order.deliveryAddress && (
                      <div className="mb-3 p-3 bg-white/10 rounded-lg">
                        <h4 className="text-white/80 text-sm font-medium mb-1 flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4" />
                          Teslimat Adresi
                        </h4>
                        <p className="text-white/70 text-sm">{order.deliveryAddress.address}</p>
                        {order.deliveryAddress.coordinates && (
                          <button
                            onClick={() => window.open(`https://maps.google.com?q=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`, '_blank')}
                            className="text-blue-300 hover:text-blue-200 text-xs underline mt-1"
                          >
                            Haritada Göster
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">{order.total.toFixed(2)} ₺</div>
                    <div className="text-white/60 text-sm capitalize">{order.paymentMethod}</div>
                  </div>
                </div>
                
                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <div className="text-white/80 text-sm font-medium mb-2">Ürünler:</div>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-white/70">
                          <span>
                            {item.quantity}x {item.name}
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <span className="text-white/50 ml-2">
                                ({Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')})
                              </span>
                            )}
                          </span>
                          <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {selectedDate} tarihinde sipariş bulunamadı
              </h3>
              <p className="text-white/60">
                Başka bir tarih seçmeyi deneyin veya API bağlantısını kontrol edin
              </p>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}