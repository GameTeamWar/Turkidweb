// app/admin/orders/map/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, ApiResponse } from '@/types';
import { DeliveryZone } from '@/types/admin';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ArrowLeftIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminOrdersMapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 36.8000, lng: 34.6200 }); // Mersin coordinates

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active orders
      const ordersResponse = await fetch('/api/admin/orders?status=pending,confirmed,preparing,ready,out_for_delivery');
      const ordersResult: ApiResponse<Order[]> = await ordersResponse.json();
      
      // Fetch delivery zones
      const zonesResponse = await fetch('/api/admin/delivery-zones');
      const zonesResult: ApiResponse<DeliveryZone[]> = await zonesResponse.json();
      
      if (ordersResult.success) {
        setOrders(ordersResult.data || []);
      }
      
      if (zonesResult.success) {
        setDeliveryZones(zonesResult.data || []);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#f97316';
      case 'ready': return '#8b5cf6';
      case 'out_for_delivery': return '#6366f1';
      case 'delivered': return '#10b981';
      default: return '#6b7280';
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
      default: return status;
    }
  };

  const getOrdersByZone = (zone: DeliveryZone) => {
    return orders.filter(order => 
      order.address && 
      order.address.district === zone.district ||
      order.address.neighborhood === zone.neighborhood
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
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
            <h1 className="text-white text-3xl font-bold">Siparişler - Harita Görünümü</h1>
            <p className="text-white/70 mt-1">
              {orders.length} aktif sipariş • {deliveryZones.length} teslimat bölgesi
            </p>
          </div>
        </div>
        <Link
          href="/admin/delivery-zones"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
        >
          <CogIcon className="w-5 h-5" />
          Teslimat Bölgeleri
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="mb-4">
              <h3 className="text-white text-xl font-semibold mb-2">Canlı Harita</h3>
              <p className="text-white/70 text-sm">Siparişlerin konumları ve teslimat bölgeleri</p>
            </div>
            
            {/* Map Placeholder - Google Maps/Leaflet entegrasyonu burada olacak */}
            <div className="w-full h-96 bg-gray-800 rounded-lg relative overflow-hidden">
              {/* Map will be integrated here */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPinIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Harita entegrasyonu burada görünecek</p>
                  <p className="text-white/40 text-sm mt-2">Google Maps API / Leaflet</p>
                </div>
              </div>
              
              {/* Sample markers for visualization */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-white">Bekleyen Siparişler</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-white">Hazırlanıyor</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-white">Yolda</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-white">Teslimat Bölgeleri</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-xl font-semibold mb-4">Aktif Siparişler</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedOrder?.id === order.id
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">#{order.orderNumber}</span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="text-white/80 text-sm mb-2">{order.userName}</div>
                  
                  {order.address && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPinIcon className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                      <span className="text-white/60 text-xs leading-relaxed">
                        {order.address.fullAddress}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{order.total.toFixed(2)} ₺</span>
                    <div className="flex items-center gap-1">
                      {order.status === 'out_for_delivery' && (
                        <TruckIcon className="w-4 h-4 text-indigo-400" />
                      )}
                      <ClockIcon className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {orders.length === 0 && (
                <div className="text-center py-8">
                  <MapPinIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Aktif sipariş bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Order Details */}
          {selectedOrder && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Sipariş Detayı</h3>
                <Link
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-300"
                  title="Detayları Görüntüle"
                >
                  <EyeIcon className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-white/60 text-sm">Sipariş No:</span>
                  <div className="text-white font-medium">#{selectedOrder.orderNumber}</div>
                </div>
                
                <div>
                  <span className="text-white/60 text-sm">Müşteri:</span>
                  <div className="text-white font-medium">{selectedOrder.userName}</div>
                  <div className="text-white/70 text-sm">{selectedOrder.userEmail}</div>
                </div>
                
                <div>
                  <span className="text-white/60 text-sm">Durum:</span>
                  <div 
                    className="inline-block px-2 py-1 rounded text-white text-sm font-medium mt-1"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusText(selectedOrder.status)}
                  </div>
                </div>
                
                <div>
                  <span className="text-white/60 text-sm">Toplam:</span>
                  <div className="text-white font-bold text-lg">{selectedOrder.total.toFixed(2)} ₺</div>
                </div>
                
                <div>
                  <span className="text-white/60 text-sm">Ürünler:</span>
                  <div className="space-y-1 mt-1">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="text-white/80 text-sm">
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedOrder.phone && (
                  <div>
                    <span className="text-white/60 text-sm">Telefon:</span>
                    <div className="text-white font-medium">{selectedOrder.phone}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Zones Summary */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-semibold">Teslimat Bölgeleri Özeti</h3>
          <Link
            href="/admin/delivery-zones"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-300"
          >
            Tümünü Yönet →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deliveryZones.slice(0, 3).map((zone) => {
            const zoneOrders = getOrdersByZone(zone);
            return (
              <div key={zone.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{zone.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    zone.isActive 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {zone.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                
                <div className="text-white/70 text-sm mb-2">
                  {zone.district} • {zone.neighborhood}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-white/60 text-sm">
                    {zoneOrders.length} aktif sipariş
                  </div>
                  <div className="text-white font-bold text-sm">
                    {zone.deliveryFee.toFixed(2)} ₺
                  </div>
                </div>
                
                {zone.estimatedDeliveryTime && (
                  <div className="flex items-center gap-1 mt-2">
                    <ClockIcon className="w-4 h-4 text-white/60" />
                    <span className="text-white/60 text-xs">
                      {zone.estimatedDeliveryTime} dk
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          
          {deliveryZones.length === 0 && (
            <div className="col-span-full text-center py-8">
              <MapPinIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Teslimat bölgesi tanımlanmamış</p>
              <Link
                href="/admin/delivery-zones"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
              >
                Teslimat Bölgesi Ekle →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Toplam Aktif Sipariş</p>
              <p className="text-white text-2xl font-bold">{orders.length}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Yolda Olan</p>
              <p className="text-white text-2xl font-bold">
                {orders.filter(o => o.status === 'out_for_delivery').length}
              </p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Hazırlanıyor</p>
              <p className="text-white text-2xl font-bold">
                {orders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Aktif Bölge</p>
              <p className="text-white text-2xl font-bold">
                {deliveryZones.filter(z => z.isActive).length}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <MapPinIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}