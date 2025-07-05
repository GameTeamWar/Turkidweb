// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Order, CartItem } from '@/types';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = adminDb.collection('orders').orderBy('createdAt', 'desc');

    // Admin tüm siparişleri görebilir, user sadece kendi siparişlerini
    if ((session.user as any)?.role !== 'admin') {
      query = query.where('userEmail', '==', session.user?.email);
    } else if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];

    return NextResponse.json<ApiResponse<Order[]>>({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Siparişler yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod, orderNote, address, phone } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sepet boş',
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ödeme yöntemi seçiniz',
      }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // %8 KDV
    const total = subtotal + tax;

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const orderData: Omit<Order, 'id'> = {
      userId: session.user?.email || '',
      userEmail: session.user?.email || '',
      userName: session.user?.name || '',
      items,
      subtotal,
      tax,
      total,
      status: 'pending',
      paymentMethod,
      orderNote,
      address,
      phone,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 dakika
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('orders').doc(orderId).set(orderData);

    // Create order status history
    await adminDb.collection('orders').doc(orderId).collection('statusHistory').add({
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: 'Sipariş alındı',
    });

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: { id: orderId, ...orderData },
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Sipariş oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}