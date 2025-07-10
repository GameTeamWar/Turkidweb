// app/admin/orders/map/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dinamik olarak sadece client'ta Leaflet yükle
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

import 'leaflet/dist/leaflet.css';
// Leaflet icon fix for Next.js
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Order = {
  id: string;
  userName: string;
  deliveryAddress: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
};

export default function OrdersMapPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // userLocation state'i eksikti, ekleniyor:
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchOrderLocations = () => {
    setLoading(true);
    fetch('/api/admin/orders?status=confirmed,preparing,ready,out_for_delivery')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(
            (data.data || []).filter(
              (o: any) => o.deliveryAddress && o.deliveryAddress.coordinates && typeof o.deliveryAddress.coordinates.lat === 'number' && typeof o.deliveryAddress.coordinates.lng === 'number'
            )
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrderLocations();
    // Kullanıcının konumunu isteğe bağlı olarak alabilirsiniz:
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }
  }, []);

  // Harita merkezi
  const center =
    userLocation
      ? [userLocation.lat, userLocation.lng]
      : orders.length > 0
        ? [orders[0].deliveryAddress!.coordinates!.lat, orders[0].deliveryAddress!.coordinates!.lng]
        : [38.4192, 27.1287];

  return (
    <div className="h-[calc(100vh-80px)] w-full relative">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold text-white">Teslimat Siparişleri Haritası</h1>
        <button
          onClick={fetchOrderLocations}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
        >
          Konumları Çek ve Göster
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <span className="ml-4 text-white text-lg">Harita yükleniyor...</span>
        </div>
      ) : (
        <MapContainer
          center={center as [number, number]}
          zoom={13}
          style={{ height: '80vh', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Kullanıcı konumu */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Bulunduğunuz Konum</Popup>
            </Marker>
          )}
          {/* Sipariş markerları */}
          {orders.map((order, idx) => (
            <Marker
              key={order.id}
              position={[order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="background:#ff6600;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:2px solid #fff;">${idx + 1}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <div>
                  <div className="font-bold">{idx + 1}. {order.userName}</div>
                  <div className="text-xs">{order.deliveryAddress.address}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      <style>{`
        .custom-marker {
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}