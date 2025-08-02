'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  SpeakerWaveIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface RestaurantSettings {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  workingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  deliverySettings: {
    isDeliveryEnabled: boolean;
    deliveryFee: number;
    freeDeliveryMinAmount: number;
    maxDeliveryDistance: number;
    estimatedDeliveryTime: number;
  };
  orderSettings: {
    minOrderAmount: number;
    maxOrdersPerHour: number;
    autoAcceptOrders: boolean;
    requirePhoneVerification: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    soundNotifications: boolean;
  };
  paymentSettings: {
    cashOnDelivery: boolean;
    cardPayment: boolean;
    onlinePayment: boolean;
  };
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: 'Turki Burger',
    description: 'En lezzetli burgerler ve fast food çeşitleri',
    phone: '+90 532 123 45 67',
    email: 'info@turkiburger.com',
    address: 'Atatürk Caddesi No:123, Merkez/İstanbul',
    workingHours: {
      monday: { open: '09:00', close: '23:00', isOpen: true },
      tuesday: { open: '09:00', close: '23:00', isOpen: true },
      wednesday: { open: '09:00', close: '23:00', isOpen: true },
      thursday: { open: '09:00', close: '23:00', isOpen: true },
      friday: { open: '09:00', close: '23:00', isOpen: true },
      saturday: { open: '10:00', close: '24:00', isOpen: true },
      sunday: { open: '10:00', close: '22:00', isOpen: true },
    },
    deliverySettings: {
      isDeliveryEnabled: true,
      deliveryFee: 5.00,
      freeDeliveryMinAmount: 50.00,
      maxDeliveryDistance: 10,
      estimatedDeliveryTime: 30,
    },
    orderSettings: {
      minOrderAmount: 25.00,
      maxOrdersPerHour: 50,
      autoAcceptOrders: false,
      requirePhoneVerification: true,
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      soundNotifications: true,
    },
    paymentSettings: {
      cashOnDelivery: true,
      cardPayment: true,
      onlinePayment: false,
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchSettings();
  }, [session, status, router]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        setHasChanges(false);
      } else {
        toast.error(result.error || 'Ayarlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      toast.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Ayarlar başarıyla kaydedildi');
        setHasChanges(false);
      } else {
        toast.error(result.error || 'Ayarlar kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Tüm değişiklikleri geri almak istediğinizden emin misiniz?')) return;
    
    await fetchSettings();
    toast.success('Ayarlar sıfırlandı');
  };

  const tabs = [
    { id: 'general', name: 'Genel Bilgiler', icon: CogIcon },
    { id: 'hours', name: 'Çalışma Saatleri', icon: ClockIcon },
    { id: 'delivery', name: 'Teslimat', icon: TruckIcon },
    { id: 'orders', name: 'Siparişler', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Bildirimler', icon: BellIcon },
    { id: 'payments', name: 'Ödeme', icon: CurrencyDollarIcon },
  ];

  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar',
  };

  if (status === 'loading' || fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Restoran Ayarları</h1>
          <p className="text-white/70 mt-2">
            Restoranınızın genel ayarlarını yönetin
            {hasChanges && <span className="text-yellow-400 ml-2">• Kaydedilmemiş değişiklikler var</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <button
              onClick={handleResetSettings}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              Değişiklikleri Geri Al
            </button>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={loading || !hasChanges}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.deliverySettings.isDeliveryEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm font-medium">Teslimat</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.deliverySettings.isDeliveryEnabled ? 'Aktif' : 'Pasif'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.orderSettings.autoAcceptOrders ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-white text-sm font-medium">Otomatik Onay</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.orderSettings.autoAcceptOrders ? 'Açık' : 'Kapalı'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.paymentSettings.cashOnDelivery ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm font-medium">Nakit Ödeme</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.paymentSettings.cashOnDelivery ? 'Aktif' : 'Pasif'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.notificationSettings.soundNotifications ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm font-medium">Sesli Uyarı</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.notificationSettings.soundNotifications ? 'Açık' : 'Kapalı'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white text-sm font-medium">Min Sipariş</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.orderSettings.minOrderAmount}₺
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-white text-sm font-medium">Teslimat Ücreti</span>
          </div>
          <div className="text-white/60 text-xs">
            {settings.deliverySettings.deliveryFee}₺
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Genel Bilgiler</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${settings.name && settings.phone && settings.email ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {settings.name && settings.phone && settings.email ? 'Tamamlandı' : 'Eksik bilgi'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Restoran Adı *
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Restoran Adresi
                  </label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                    placeholder="Tam adresinizi girin (Sokak, Mahalle, İlçe, İl)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Açıklama
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Çalışma Saatleri</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${Object.values(settings.workingHours).some(h => h.isOpen) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {Object.values(settings.workingHours).filter(h => h.isOpen).length} gün açık
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {Object.entries(settings.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-24">
                      <span className="text-white font-medium">
                        {dayNames[day as keyof typeof dayNames]}
                      </span>
                    </div>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: {
                            ...prev.workingHours,
                            [day]: { ...hours, isOpen: e.target.checked }
                          }
                        }))}
                        className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                      />
                      <span className="text-white text-sm">Açık</span>
                    </label>

                    {hours.isOpen && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm">Açılış:</span>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                [day]: { ...hours, open: e.target.value }
                              }
                            }))}
                            className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm">Kapanış:</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                [day]: { ...hours, close: e.target.value }
                              }
                            }))}
                            className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Settings */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Teslimat Ayarları</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${settings.deliverySettings.isDeliveryEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {settings.deliverySettings.isDeliveryEnabled ? 'Teslimat aktif' : 'Teslimat pasif'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.deliverySettings.isDeliveryEnabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      deliverySettings: { ...prev.deliverySettings, isDeliveryEnabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white font-medium">Teslimat hizmeti aktif</span>
                </label>

                {settings.deliverySettings.isDeliveryEnabled && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Teslimat Ücreti (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.deliverySettings.deliveryFee}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          deliverySettings: { ...prev.deliverySettings, deliveryFee: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Ücretsiz Teslimat Minimum Tutar (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.deliverySettings.freeDeliveryMinAmount}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          deliverySettings: { ...prev.deliverySettings, freeDeliveryMinAmount: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Maksimum Teslimat Mesafesi (km)
                      </label>
                      <input
                        type="number"
                        value={settings.deliverySettings.maxDeliveryDistance}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          deliverySettings: { ...prev.deliverySettings, maxDeliveryDistance: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Tahmini Teslimat Süresi (dakika)
                      </label>
                      <input
                        type="number"
                        value={settings.deliverySettings.estimatedDeliveryTime}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          deliverySettings: { ...prev.deliverySettings, estimatedDeliveryTime: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Settings */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Sipariş Ayarları</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${settings.orderSettings.autoAcceptOrders ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {settings.orderSettings.autoAcceptOrders ? 'Otomatik onay' : 'Manuel onay'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Minimum Sipariş Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.orderSettings.minOrderAmount}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      orderSettings: { ...prev.orderSettings, minOrderAmount: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Saatlik Maksimum Sipariş Sayısı
                  </label>
                  <input
                    type="number"
                    value={settings.orderSettings.maxOrdersPerHour}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      orderSettings: { ...prev.orderSettings, maxOrdersPerHour: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.orderSettings.autoAcceptOrders}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      orderSettings: { ...prev.orderSettings, autoAcceptOrders: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">Siparişleri otomatik onayla</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.orderSettings.requirePhoneVerification}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      orderSettings: { ...prev.orderSettings, requirePhoneVerification: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">Telefon doğrulaması zorunlu</span>
                </label>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Bildirim Ayarları</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${Object.values(settings.notificationSettings).some(Boolean) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {Object.values(settings.notificationSettings).filter(Boolean).length} bildirim aktif
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.emailNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, emailNotifications: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <EnvelopeIcon className="w-5 h-5 text-white/60" />
                  <span className="text-white">E-mail bildirimleri</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.smsNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, smsNotifications: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <PhoneIcon className="w-5 h-5 text-white/60" />
                  <span className="text-white">SMS bildirimleri</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.pushNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, pushNotifications: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <BellIcon className="w-5 h-5 text-white/60" />
                  <span className="text-white">Push bildirimleri</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.soundNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, soundNotifications: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <SpeakerWaveIcon className="w-5 h-5 text-white/60" />
                  <span className="text-white">Sesli uyarılar</span>
                </label>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Ödeme Ayarları</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${Object.values(settings.paymentSettings).some(Boolean) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-sm">
                    {Object.values(settings.paymentSettings).filter(Boolean).length} ödeme yöntemi aktif
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.paymentSettings.cashOnDelivery}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      paymentSettings: { ...prev.paymentSettings, cashOnDelivery: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">💵 Kapıda nakit ödeme</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.paymentSettings.cardPayment}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      paymentSettings: { ...prev.paymentSettings, cardPayment: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">💳 Kapıda kart ile ödeme</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.paymentSettings.onlinePayment}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      paymentSettings: { ...prev.paymentSettings, onlinePayment: e.target.checked }
                    }))}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">🌐 Online ödeme</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
