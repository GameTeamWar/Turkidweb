import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock data storage - replace with your database implementation
let restaurantSettings = {
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
  updatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: restaurantSettings
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.phone || !data.email) {
      return NextResponse.json(
        { success: false, error: 'Restoran adı, telefon ve e-mail zorunludur' },
        { status: 400 }
      );
    }

    // Update settings
    restaurantSettings = {
      ...restaurantSettings,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: restaurantSettings,
      message: 'Ayarlar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
