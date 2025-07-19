// hooks/useAdminNotifications.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Order } from '@/types';

interface UseAdminNotificationsOptions {
  enabled?: boolean;
  pollingInterval?: number;
  maxRetries?: number;
}

export function useAdminNotifications(options: UseAdminNotificationsOptions = {}) {
  const { data: session } = useSession();
  const {
    enabled = true,
    pollingInterval = 10000, // 10 saniye
    maxRetries = 3
  } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  const lastNotificationTimeRef = useRef(0);

  // Ses dosyasını hazırla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.8;
      
      // Fallback olarak sistem sesi
      if (!audioRef.current.src) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1O/OWiEHOobQ9N2QQAoUXrXs4phRAw');
      }
    }
  }, []);

  // Admin kontrolü ve ses iznini al
  const enableNotifications = useCallback(async () => {
    if (!session || (session.user as any)?.role !== 'admin') {
      return false;
    }

    try {
      // Tarayıcı bildirim iznini iste
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Bildirim izni verilmedi');
        }
      }

      // Ses çalmak için kullanıcı etkileşimi gerekli
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (error) {
          console.warn('Ses testi başarısız:', error);
        }
      }

      setIsEnabled(true);
      localStorage.setItem('adminNotificationsEnabled', 'true');
      return true;
    } catch (error) {
      console.error('Bildirim etkinleştirme hatası:', error);
      return false;
    }
  }, [session]);

  // Bildirimleri devre dışı bırak
  const disableNotifications = useCallback(() => {
    setIsEnabled(false);
    localStorage.setItem('adminNotificationsEnabled', 'false');
    
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    isPlayingRef.current = false;
  }, []);

  // Ses çal
  const playNotificationSound = useCallback(async (order: Order) => {
    if (!isEnabled || isPlayingRef.current) return;

    const now = Date.now();
    // Aynı sipariş için 30 saniye içinde tekrar çalma
    if (now - lastNotificationTimeRef.current < 30000) return;

    try {
      isPlayingRef.current = true;
      lastNotificationTimeRef.current = now;

      // Ses çal
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        
        // 3 kez tekrarla (onaylanana kadar)
        for (let i = 0; i < 2; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!pendingOrders.some(o => o.id === order.id)) break; // Sipariş onaylandıysa dur
          
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        }
      }

      // Tarayıcı bildirimi göster
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🔔 Yeni Sipariş!', {
          body: `#${order.orderNumber} - ${order.userName}\n${order.total.toFixed(2)} ₺`,
          icon: '/icons/order-notification.png',
          tag: `order-${order.id}`,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = `/admin/orders/${order.id}`;
          notification.close();
        };

        // 10 saniye sonra otomatik kapat
        setTimeout(() => notification.close(), 10000);
      }

    } catch (error) {
      console.error('Ses çalma hatası:', error);
    } finally {
      isPlayingRef.current = false;
    }
  }, [isEnabled, pendingOrders]);

  // Bekleyen siparişleri kontrol et
  const checkPendingOrders = useCallback(async () => {
    if (!isEnabled || !session || (session.user as any)?.role !== 'admin') {
      return;
    }

    try {
      const response = await fetch('/api/admin/orders?status=pending');
      if (!response.ok) throw new Error('API hatası');

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const orders = result.data || [];
      const currentPendingOrders = orders.filter((o: Order) => o.status === 'pending');
      
      // Yeni sipariş kontrolü
      if (currentPendingOrders.length > lastOrderCount && lastOrderCount > 0) {
        const newOrders = currentPendingOrders.slice(0, currentPendingOrders.length - lastOrderCount);
        
        for (const newOrder of newOrders) {
          await playNotificationSound(newOrder);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Siparişler arası bekleme
        }
      }

      setPendingOrders(currentPendingOrders);
      setLastOrderCount(currentPendingOrders.length);
      retryCountRef.current = 0; // Başarılı istek sonrası retry sayacını sıfırla

    } catch (error) {
      console.error('Sipariş kontrolü hatası:', error);
      retryCountRef.current++;
      
      // Max retry sayısına ulaşıldıysa bildirimleri geçici olarak durdur
      if (retryCountRef.current >= maxRetries) {
        console.warn('Max retry sayısına ulaşıldı, bildirimler geçici olarak durduruluyor');
        setTimeout(() => {
          retryCountRef.current = 0;
        }, 60000); // 1 dakika sonra tekrar dene
      }
    }
  }, [isEnabled, session, lastOrderCount, maxRetries, playNotificationSound]);

  // Polling başlat/durdur
  useEffect(() => {
    if (isEnabled && enabled && session && (session.user as any)?.role === 'admin') {
      checkPendingOrders(); // İlk kontrol
      
      intervalRef.current = setInterval(checkPendingOrders, pollingInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isEnabled, enabled, session, pollingInterval, checkPendingOrders]);

  // Sayfa kapandığında temizlik
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, []);

  // LocalStorage'dan ayarları yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminNotificationsEnabled');
      if (saved === 'true' && session && (session.user as any)?.role === 'admin') {
        enableNotifications();
      }
    }
  }, [session, enableNotifications]);

  return {
    isEnabled,
    pendingOrders,
    enableNotifications,
    disableNotifications,
    pendingCount: pendingOrders.length
  };
}
