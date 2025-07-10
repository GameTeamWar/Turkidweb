// app/admin/orders/page.tsx - Enhanced with audio notifications
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderFilters, ApiResponse } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { audioNotification } from '@/lib/audio-notification';
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
  ArrowPathIcon,
  MapPinIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArchiveBoxIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showMoveToHistory, setShowMoveToHistory] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: undefined,
    paymentStatus: undefined,
    paymentMethod: undefined,
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // LocalStorage'dan ses ayarını yükle
  useEffect(() => {
    const savedAudioSetting = localStorage.getItem('adminAudioEnabled');
    if (savedAudioSetting !== null) {
      setAudioEnabled(JSON.parse(savedAudioSetting));
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchOrders();
    // Auto-refresh every 15 seconds for new orders
    const interval = setInterval(() => {
      fetchOrders(false, true); // silent fetch for audio detection
    }, 15000);
    
    return () => clearInterval(interval);
  }, [session, status, router]);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // Auto cleanup at closing time
  useEffect(() => {
    const checkAutoCleanup = async () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Kapanış saatinde otomatik temizlik (23:00)
      if (hour === 23 && now.getMinutes() === 0) {
        try {
          await fetch('/api/admin/orders/move-to-history?action=auto-cleanup');
          toast.success('Günlük siparişler otomatik olarak geçmişe taşındı');
          fetchOrders();
        } catch (error) {
          console.error('Auto cleanup failed:', error);
        }
      }
    };

    const dailyCheck = setInterval(checkAutoCleanup, 60000); // Check every minute
    return () => clearInterval(dailyCheck);
  }, []);

  const fetchOrders = async (showLoading = true, checkForNewOrders = false) => {
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
        const newOrders = result.data || [];
        
        // Check for new orders for audio notification
        if (checkForNewOrders && audioEnabled && lastOrderCount > 0) {
          if (newOrders.length > lastOrderCount) {
            const latestOrder = newOrders[0]; // Assuming orders are sorted by newest first
            
            // Play audio notification for new order
            audioNotification.notifyNewOrder({
              orderNumber: latestOrder.orderNumber,
              customerName: latestOrder.userName,
              items: latestOrder.items.map(item => ({
                name: item.name,
                quantity: item.quantity
              })),
              total: latestOrder.total,
              isUrgent: false // You can add logic to determine urgency
            });

            toast.success(`🔔 Yeni sipariş: #${latestOrder.orderNumber}`, {
              duration: 5000,
              style: {
                background: 'linear-gradient(45deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 'bold'
              }
            });
          }
        }
        
        setOrders(newOrders);
        setLastOrderCount(newOrders.length);
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

  const enableAudioNotifications = async () => {
    try {
      const enabled = await audioNotification.enableNotifications();
      const permissionGranted = await audioNotification.requestNotificationPermission();
      
      if (enabled) {
        setAudioEnabled(true);
        localStorage.setItem('adminAudioEnabled', 'true');
        audioNotification.testSound();
        toast.success('🔊 Sesli uyarılar aktif edildi');
      } else {
        toast.error('Sesli uyarılar etkinleştirilemedi');
      }
    } catch (error) {
      console.error('Audio enable error:', error);
      toast.error('Sesli uyarı sistemi hatası');
    }
  };

  const disableAudioNotifications = () => {
    setAudioEnabled(false);
    localStorage.setItem('adminAudioEnabled', 'false');
    toast.success('🔇 Sesli uyarılar deaktif edildi');
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handleMoveToHistory = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Lütfen geçmişe taşımak için en az bir sipariş seçin');
      return;
    }

    const completedOrders = orders.filter(order => 
      selectedOrders.includes(order.id) && 
      ['delivered', 'cancelled'].includes(order.status)
    );

    if (completedOrders.length === 0) {
      toast.error('Sadece teslim edilmiş veya iptal edilmiş siparişler geçmişe taşınabilir');
      return;
    }

    if (!confirm(`Seçili ${completedOrders.length} sipariş geçmişe taşınacak. Onaylıyor musunuz?`)) return;

    try {
      const response = await fetch('/api/admin/orders/move-to-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: completedOrders.map(o => o.id),
          targetDate: new Date().toISOString().split('T')[0]
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`${result.data.movedCount} sipariş geçmişe taşındı`);
        setSelectedOrders([]);
        setShowMoveToHistory(false);
        fetchOrders(false);
      } else {
        toast.error(result.error || 'Siparişler geçmişe taşınırken hata oluştu');
      }
    } catch (error) {
      console.error('Move to history error:', error);
      toast.error('Siparişler geçmişe taşınırken hata oluştu');
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
      const promises = selectedOrders.map(orderId => 
        fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            updatedBy: session?.user?.name || 'Admin'
          }),
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} sipariş durumu güncellendi`);
      setSelectedOrders([]);
      fetchOrders(false);
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

  const filteredOrders = useMemo(() => orders.filter(order => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(search) ||
        order.userName.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search)
      );
    }
    return true;
  }), [orders, filters.search]);

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

  // Statistics
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const outForDeliveryOrders = orders.filter(o => o.status === 'out_for_delivery').length;
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length;
  
  const todayRevenue = orders
    .filter(o => {
      try {
        if (!o.createdAt || o.status === 'cancelled') return false;
        let orderDate: Date;
        const createdAt = o.createdAt as any;
        
        if (typeof createdAt === 'string') {
          orderDate = new Date(createdAt);
        } else if (createdAt instanceof Date) {
          orderDate = createdAt;
        } else if (createdAt && typeof createdAt === 'object' && typeof createdAt.toDate === 'function') {
          orderDate = createdAt.toDate();
        } else {
          return false;
        }
        
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      } catch (error) {
        return false;
      }
    })
    .reduce((sum, o) => sum + o.total, 0);

  // Harita sayfası için (örnek: /admin/orders/map)
  // Eğer harita bileşeniniz ayrı bir dosyada ise:
  // const MapComponent = dynamic(() => import('@/components/admin/OrdersMap'), {
  //   ssr: false,
  //   loading: () => (
  //     <div className="flex items-center justify-center h-96">
  //       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
  //       <span className="ml-4 text-white text-lg">Harita yükleniyor...</span>
  //     </div>
  //   ),
  // });

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">Sipariş Yönetimi</h1>
            <p className="text-white/80">
              Toplam {orders.length} sipariş • {selectedOrders.length} seçili
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Audio Control */}
            <button
              onClick={audioEnabled ? disableAudioNotifications : enableAudioNotifications}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                audioEnabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {audioEnabled ? (
                <>
                  <SpeakerWaveIcon className="w-5 h-5" />
                  Ses Aktif
                </>
              ) : (
                <>
                  <SpeakerXMarkIcon className="w-5 h-5" />
                  Ses Kapalı
                </>
              )}
            </button>

            {/* History Link */}
            <Link
              href="/admin/orders/history"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
            >
              <HistoryIcon className="w-5 h-5" />
              Geçmiş
            </Link>

            <Link
              href="/admin/orders/map"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
            >
              <MapPinIcon className="w-5 h-5" />
              Harita
            </Link>
            
            <button
              onClick={() => fetchOrders(false)}
              disabled={refreshing}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-8 h-8 text-yellow-300" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Bekliyor</p>
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
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-indigo-300" />
              <div>
                <p className="text-indigo-300 text-sm font-medium">Yolda</p>
                <p className="text-white text-xl font-bold">{outForDeliveryOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
              <div>
                <p className="text-gray-300 text-sm font-medium">Tamamlandı</p>
                <p className="text-white text-xl font-bold">{completedOrders}</p>
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
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
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

      {/* Select All Checkbox */}
      {filteredOrders.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
            />
            <span className="text-white font-medium">
              {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 
                ? 'Tümünün seçimini kaldır' 
                : 'Tümünü seç'
              } ({filteredOrders.length} sipariş)
            </span>
          </label>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
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
              <button
                onClick={handleMoveToHistory}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                Geçmişe Taşı
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

                <div className="mb-4 p-4 bg-white/10 rounded-lg">
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-white">
                            {item.quantity}x {item.name}
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <span className="text-white/60 ml-2">
                                ({Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')})
                              </span>
                            )}
                          </span>
                          <span className="text-white/80">{(item.price * item.quantity).toFixed(2)} ₺</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/60">Ürün bilgisi bulunamadı</p>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.deliveryAddress && (
                  <div className="mb-4 p-4 bg-white/10 rounded-lg">
                    <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      Teslimat Bilgileri
                    </h4>
                    <p className="text-white text-sm">{order.deliveryAddress.address}</p>
                    {order.deliveryAddress.details && (
                      <p className="text-white/60 text-sm">Detay: {order.deliveryAddress.details}</p>
                    )}
                    {order.deliveryAddress.coordinates && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/60 text-xs">
                          Konum: {order.deliveryAddress.coordinates.lat.toFixed(6)}, {order.deliveryAddress.coordinates.lng.toFixed(6)}
                        </span>
                        <button
                          onClick={() => window.open(`https://maps.google.com?q=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`, '_blank')}
                          className="text-blue-300 hover:text-blue-200 text-xs underline"
                        >
                          Haritada Göster
                        </button>
                      </div>
                    )}
                    {order.note && (
                      <p className="text-yellow-300 text-sm mt-2">Not: {order.note}</p>
                    )}
                  </div>
                )}

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-white/60 text-sm">
                      {formatDistanceToNow(
                        order.createdAt instanceof Date 
                          ? order.createdAt 
                          : new Date(order.createdAt),
                        { addSuffix: true, locale: tr }
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getNextStatuses(order.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300 ${
                          nextStatus === 'cancelled' 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        {getStatusText(nextStatus)}
                      </button>
                    ))}
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-300"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">Sipariş bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}