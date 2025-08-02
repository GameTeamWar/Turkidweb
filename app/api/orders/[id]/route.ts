// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Order } from '@/types';
import type { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📦 Get order API called for ID:', params.id);
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil. Firebase yapılandırmasını kontrol edin.',
      }, { status: 503 });
    }

    const orderId = params.id;
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Check if user owns the order (unless admin)
    if ((session.user as any)?.role !== 'admin' && orderData?.userEmail !== session.user?.email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu siparişe erişim yetkiniz yok',
      }, { status: 403 });
    }

    const order: Order = {
      id: orderDoc.id,
      ...orderData,
      // Tarih alanlarını string'e çevir
      createdAt: orderData?.createdAt?.toDate ? orderData.createdAt.toDate().toISOString() : orderData?.createdAt,
      updatedAt: orderData?.updatedAt?.toDate ? orderData.updatedAt.toDate().toISOString() : orderData?.updatedAt,
      estimatedDeliveryTime: orderData?.estimatedDeliveryTime?.toDate ? 
        orderData.estimatedDeliveryTime.toDate().toISOString() : orderData?.estimatedDeliveryTime,
      // Items array'ini garanti et
      items: Array.isArray(orderData?.items) ? orderData.items : [],
      // Sayısal alanları garanti et
      total: typeof orderData?.total === 'number' ? orderData.total : 0,
      subtotal: typeof orderData?.subtotal === 'number' ? orderData.subtotal : 0,
      tax: typeof orderData?.tax === 'number' ? orderData.tax : 0,
    };

    console.log('✅ Order fetched successfully');

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error('❌ Get order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}