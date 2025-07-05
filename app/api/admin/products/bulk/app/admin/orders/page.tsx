// app/admin/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderFilters, ApiResponse } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: undefined,
    paymentStatus: undefined,
    paymentMethod: undefined,
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [session, status, router, filters]);

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/admin/orders?${queryParams}`);
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
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
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
        fetchOrders(false);
      } else {
        toast.error(result.error || 'Sipariş durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Sipariş durumu güncellenirken hata oluştu');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Order['status']) => {
    if (selectedOrders.length === 0) {
      toast.error('Lütfen en az bir sipariş seçin');
      return;
    }

    if (!confirm(`Seçili ${selectedOrders.length} siparişin durumunu güncellemek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch('/api/admin/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
          updatedBy: session?.user?.name || 'Admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`${selectedOrders.length} sipariş durumu güncellendi`);
        setSelectedOrders([]);
        fetchOrders(false);
      } else {
        toast.error(result.error || 'Toplu güncelleme sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Toplu güncelleme sırasında hata oluştu');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'confirmed': return 'bg-blue-500/20 text-blue-300';
      case 'preparing': return 'bg-orange-500/20 text-orange-300';
      case 'ready': return 'bg-purple-500/20 text-purple-300';
      case 'out_for_delivery': return 'bg-indigo-500/20 text-indigo-300';
      case 'delivered': return 'bg-green-500/20 text-green-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
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
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'preparing': return <ClockIcon className="w-4 h-4" />;
      case 'ready': return <CheckCircleIcon className="w-4 h-4" />;
      case 'out_for_delivery': return <TruckIcon className="w-4 h-4" />;
      case 'delivered': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'text-green-300';
      case 'pending': return 'text-yellow-300';
      case 'failed': return 'text-red-300';
      case 'refunded': return 'text-purple-300';
      default: return 'text-gray-300';
    }
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
    return true;
  });

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
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const todayRevenue = orders
    .filter(o => o.createdAt.startsWith(new Date().toISOString().split('T')[0]) && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Sipariş Yönetimi</h1>
              <p className="text-white/80">
                Toplam {orders.length} sipariş • {selectedOrders.length} seçili
              </p>
            </div>
            <button
              onClick={() => fetchOrders(false)}
              disabled={refreshing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Bekleyen</p>
                  <p className="text-white text-xl font-bold">{pendingOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-orange-300" />
                <div>
                  <p className="text-orange-300 text-sm font-medium">Hazırlanıyor</p>
                  <p className="text-white text-xl font-bold">{preparingOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-purple-300" />
                <div>
                  <p className="text-purple-300 text-sm font-medium">Hazır</p>
                  <p className="text-white text-xl font-bold">{readyOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-8 h-8 text-green-300" />
                <div>
                  <p className="text-green-300 text-sm font-medium">Bugün Ciro</p>
                  <p className="text-white text-xl font-bold">{todayRevenue.toFixed(2)} ₺</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Order['status'] || undefined }))}
                className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
              >
                <option value="">Tüm Durumlar</option>
                <option value="pending">Bekleyen</option>
                <option value="confirmed">Onaylandı</option>
                <option value="preparing">Hazırlanıyor</option>
                <option value="ready">Hazır</option>
                <option value="out_for_delivery">Yolda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal</option>
              </select>

              <select
                value={filters.paymentMethod || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value as Order['paymentMethod'] || undefined }))}
                className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
              >
                <option value="">Tüm Ödeme Yöntemleri</option>
                <option value="card">Kart</option>
                <option value="cash">Nakit</option>
                <option value="online">Online</option>
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

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">
                {selectedOrders.length} sipariş seçili
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('confirmed')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Onayla
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('preparing')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Hazırlığa Al
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('ready')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Hazır
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('cancelled')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  İptal Et
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrders(prev => [...prev, order.id]);
                    } else {
                      setSelectedOrders(prev => prev.filter(id => id !== order.id));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500 mt-1"
                />

                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">#{order.orderNumber}</h3>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <UserIcon className="w-4 h-4" />
                          <span>{order.userName}</span>
                          <span>•</span>
                          <span>{order.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-bold text-xl">{order.total.toFixed(2)} ₺</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <span className="text-white/60 text-sm">•</span>
                        <span className="text-white/60 text-sm">{order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 p-4 bg-white/10 rounded-lg">
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

                  {/* Order Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </span>
                      
                      <span className="text-white/60 text-sm">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: tr })}
                      </span>

                      {order.phone && (
                        <span className="text-white/60 text-sm">
                          📞 {order.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Update Buttons */}
                      {getNextStatuses(order.status).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order.id, status)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300 ${
                            status === 'cancelled' 
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {getStatusText(status)}
                        </button>
                      ))}

                      {/* View Details */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-300"
                        title="Detayları Görüntüle"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Notes */}
                  {(order.orderNote || order.adminNote) && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      {order.orderNote && (
                        <div className="mb-2">
                          <span className="text-white/80 text-sm font-medium">Müşteri Notu: </span>
                          <span className="text-white text-sm">{order.orderNote}</span>
                        </div>
                      )}
                      {order.adminNote && (
                        <div>
                          <span className="text-yellow-300 text-sm font-medium">Admin Notu: </span>
                          <span className="text-white text-sm">{order.adminNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-white text-xl font-semibold mb-2">Sipariş bulunamadı</h3>
            <p className="text-white/60">
              {filters.search || filters.status 
                ? 'Arama kriterlerinize uygun sipariş bulunamadı'
                : 'Henüz hiç sipariş alınmamış'
              }
            </p>
          </div>
        )}
      </div>

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