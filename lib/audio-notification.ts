// lib/audio-notification.ts
export class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  async enableNotifications() {
    if (!this.audioContext) return false;

    try {
      // User interaction gerekli - button click ile enable et
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isEnabled = true;
      return true;
    } catch (error) {
      console.error('Failed to enable audio notifications:', error);
      return false;
    }
  }

  // Başarılı sipariş sesi - yumuşak ding
  private playSuccessSound() {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Acil sipariş sesi - 3 kez çalacak
  private playUrgentSound() {
    if (!this.audioContext || !this.isEnabled) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(600, this.audioContext!.currentTime);
        oscillator.frequency.setValueAtTime(900, this.audioContext!.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext!.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.4);

        oscillator.start(this.audioContext!.currentTime);
        oscillator.stop(this.audioContext!.currentTime + 0.4);
      }, i * 500);
    }
  }

  // Text-to-Speech ile sipariş okuma
  private speakOrderDetails(orderText: string) {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(orderText);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    speechSynthesis.speak(utterance);
  }

  // Ana notification fonksiyonu
  notifyNewOrder(order: {
    orderNumber: string;
    customerName: string;
    items: { name: string; quantity: number }[];
    total: number;
    isUrgent?: boolean;
  }) {
    if (!this.isEnabled) return;

    // Ses çal
    if (order.isUrgent) {
      this.playUrgentSound();
    } else {
      this.playSuccessSound();
    }

    // Sipariş detaylarını oku
    setTimeout(() => {
      const itemsList = order.items
        .map(item => `${item.quantity} adet ${item.name}`)
        .join(', ');
      
      const orderText = `Yeni sipariş geldi. Sipariş numarası ${order.orderNumber}. Müşteri ${order.customerName}. Ürünler: ${itemsList}. Toplam tutar ${order.total} lira.`;
      
      this.speakOrderDetails(orderText);
    }, 1000);

    // Browser notification da göster
    this.showBrowserNotification(order);
  }

  private showBrowserNotification(order: {
    orderNumber: string;
    customerName: string;
    total: number;
  }) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Yeni Sipariş: #${order.orderNumber}`, {
        body: `${order.customerName} - ${order.total}₺`,
        icon: '/favicon.ico',
        tag: `order-${order.orderNumber}`,
        requireInteraction: true
      });
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Test sesi
  testSound() {
    this.playSuccessSound();
    setTimeout(() => {
      this.speakOrderDetails('Test sesi. Sistem çalışıyor.');
    }, 1000);
  }
}

// Singleton instance
export const audioNotification = new AudioNotificationService();