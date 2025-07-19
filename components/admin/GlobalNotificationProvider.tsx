
// components/admin/GlobalNotificationProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BellIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface NotificationContextType {
  isEnabled: boolean;
  pendingCount: number;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface GlobalNotificationProviderProps {
  children: ReactNode;
}

export function GlobalNotificationProvider({ children }: GlobalNotificationProviderProps) {
  const notifications = useAdminNotifications({
    enabled: true,
    pollingInterval: 8000, // 8 saniye
    maxRetries: 5
  });

  const handleEnableNotifications = async () => {
    const success = await notifications.enableNotifications();
    if (success) {
      toast.success('🔔 Sesli bildirimler aktif edildi!', {
        duration: 3000,
        icon: '🔊'
      });
    } else {
      toast.error('Bildirimler etkinleştirilemedi');
    }
    return success;
  };

  const handleDisableNotifications = () => {
    notifications.disableNotifications();
    toast.success('🔇 Sesli bildirimler kapatıldı', {
      duration: 2000
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        isEnabled: notifications.isEnabled,
        pendingCount: notifications.pendingCount,
        enableNotifications: handleEnableNotifications,
        disableNotifications: handleDisableNotifications
      }}
    >
      {children}
      
      {/* Global Bildirim Durum Göstergesi */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2">
          {/* Bekleyen Sipariş Sayısı */}
          {notifications.pendingCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
              <BellIcon className="w-4 h-4" />
              {notifications.pendingCount} bekleyen sipariş
            </div>
          )}
          
          {/* Bildirim Durumu */}
          <button
            onClick={notifications.isEnabled ? handleDisableNotifications : handleEnableNotifications}
            className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
              notifications.isEnabled
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
            title={notifications.isEnabled ? 'Bildirimleri Kapat' : 'Bildirimleri Aç'}
          >
            {notifications.isEnabled ? (
              <SpeakerWaveIcon className="w-6 h-6" />
            ) : (
              <SpeakerXMarkIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within GlobalNotificationProvider');
  }
  return context;
}
