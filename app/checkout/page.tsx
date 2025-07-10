// app/checkout/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { MapPinIcon } from '@heroicons/react/24/outline';
import Script from 'next/script';

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface CheckoutFormData {
  phone: string;
  paymentMethod: 'card' | 'cash' | 'online';
  orderNote?: string;
  fullAddress: string;
  addressDetails?: string;
}

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    defaultValues: {
      paymentMethod: 'card',
    },
  });

  const total = getTotalPrice();

  // Update location and get address
  const updateLocation = useCallback(async (coords: { lat: number; lng: number }) => {
    try {
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: coords });
        
        let address = '';
        if (response.results && response.results[0]) {
          address = response.results[0].formatted_address;
        } else {
          address = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        }

        const locationData: LocationData = {
          lat: coords.lat,
          lng: coords.lng,
          address: address
        };

        setLocation(locationData);
        setValue('fullAddress', address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      const locationData: LocationData = {
        lat: coords.lat,
        lng: coords.lng,
        address: `Konum: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
      };
      
      setLocation(locationData);
      setValue('fullAddress', locationData.address!);
    }
  }, [setValue]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google?.maps) {
      return;
    }

    const defaultLocation = { lat: 36.8875, lng: 34.6527 }; // Tarsus merkez
    
    try {
      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      const markerInstance = new window.google.maps.Marker({
        position: defaultLocation,
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: "Teslimat Konumu"
      });

      // Marker drag event
      markerInstance.addListener('dragend', (event: any) => {
        const newLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        updateLocation(newLocation);
      });

      // Map click event
      mapInstance.addListener('click', (event: any) => {
        const newLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        markerInstance.setPosition(event.latLng);
        updateLocation(newLocation);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setMapLoaded(true);

      // Try to get user's current location
      getCurrentLocation(mapInstance, markerInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Harita yüklenirken hata oluştu');
    }
  }, [updateLocation]);

  // Get current location
  const getCurrentLocation = useCallback((mapInstance?: any, markerInstance?: any) => {
    if (!navigator.geolocation) {
      toast.error('Bu tarayıcı konum servislerini desteklemiyor');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const currentMap = mapInstance || map;
        const currentMarker = markerInstance || marker;

        if (currentMap && currentMarker) {
          currentMap.setCenter(coords);
          currentMap.setZoom(17);
          currentMarker.setPosition(coords);
        }

        await updateLocation(coords);
        toast.success('Konumunuz alındı!');
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Konum alınamadı. Harita üzerinden seçebilirsiniz.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [map, marker, updateLocation]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!location) {
      toast.error('Teslimat için konum bilgisi gereklidir!');
      return;
    }

    try {
      setIsSubmitting(true);

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
            lat: location.lat,
            lng: location.lng
          },
          details: data.addressDetails || ''
        }
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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=tr`}
        strategy="afterInteractive"
        onLoad={() => {
          initializeMap();
        }}
        onError={(e) => {
          console.error('Google Maps script failed to load:', e);
          toast.error('Harita yüklenemedi');
        }}
      />
      
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
              Siparişinizi tamamlamak için teslimat konumunu seçin ve bilgilerinizi girin
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Map Section */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-6 h-6" />
                  Teslimat Konumu
                  <span className="text-red-400 text-sm">*</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Map Container */}
                  <div className="relative">
                    <div 
                      ref={mapContainerRef}
                      className="w-full h-80 rounded-lg overflow-hidden bg-gray-200"
                      style={{ minHeight: '320px' }}
                    />
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-white/70">Harita yükleniyor...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Location Info */}
                  {location && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-green-200 text-sm">{location.address}</p>
                          <p className="text-green-200/70 text-xs mt-1">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => getCurrentLocation()}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      Konumumu Bul
                    </button>
                    {location && (
                      <button
                        type="button"
                        onClick={() => window.open(`https://maps.google.com?q=${location.lat},${location.lng}`, '_blank')}
                        className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300"
                      >
                        Haritada Aç
                      </button>
                    )}
                  </div>
                  
                  <p className="text-white/70 text-sm">
                    📍 Harita üzerinde işaretçiyi sürükleyerek veya tıklayarak teslimat konumunu seçebilirsiniz.
                  </p>
                </div>
              </div>

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
                      <div className="text-white font-medium">Yemek Kartları (QR Kod)</div>
                      <div className="text-white/70 text-sm">Multinet, Setcard, Ticket vb. QR kod ile ödeme</div>
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
                      Adres Detayı
                    </label>
                    <textarea
                      {...register('fullAddress', {
                        required: 'Adres gerekli',
                        minLength: {
                          value: 10,
                          message: 'Adres en az 10 karakter olmalıdır',
                        },
                      })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                      placeholder="Bina no, daire no, sokak adı vb. detayları girin..."
                    />
                    {errors.fullAddress && (
                      <p className="text-red-300 text-sm mt-1">{errors.fullAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Ek Açıklama (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      {...register('addressDetails')}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="Kapıcıya söyleyin, 2. kat vb."
                    />
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
                  disabled={isSubmitting || !location}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sipariş Veriliyor...' : !location ? 'Önce Konum Seçin' : 'Siparişi Tamamla'}
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
    </>
  );
}