// app/api/admin/orders/[id]/route.ts
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
    console.log('🔍 Order detail API called for ID:', params.id);
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      console.log('❌ Firebase Admin not available');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const orderId = params.id;
    console.log('📊 Fetching order from Firebase:', orderId);

    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    const orderData = orderDoc.data();
    console.log('📋 Raw order data:', {
      id: orderDoc.id,
      hasData: !!orderData,
      hasItems: !!(orderData?.items),
      itemsCount: orderData?.items?.length || 0
    });

    const order = {
      id: orderDoc.id,
      ...orderData,
      // Tarih alanlarını string'e çevir
      createdAt: orderData?.createdAt?.toDate ? 
        orderData.createdAt.toDate().toISOString() : 
        orderData?.createdAt || new Date().toISOString(),
      updatedAt: orderData?.updatedAt?.toDate ? 
        orderData.updatedAt.toDate().toISOString() : 
        orderData?.updatedAt || new Date().toISOString(),
      estimatedDeliveryTime: orderData?.estimatedDeliveryTime?.toDate ? 
        orderData.estimatedDeliveryTime.toDate().toISOString() : 
        orderData?.estimatedDeliveryTime,
      // Items array'ini garanti et
      items: Array.isArray(orderData?.items) ? orderData.items : [],
      // Sayısal alanları garanti et
      total: typeof orderData?.total === 'number' ? orderData.total : 0,
      subtotal: typeof orderData?.subtotal === 'number' ? orderData.subtotal : 0,
      tax: typeof orderData?.tax === 'number' ? orderData.tax : 0,
      // String alanları garanti et
      orderNumber: orderData?.orderNumber || `ORD-${orderDoc.id.slice(-6)}`,
      userName: orderData?.userName || 'Bilinmeyen Kullanıcı',
      userEmail: orderData?.userEmail || 'email@bilinmiyor.com',
      status: orderData?.status || 'pending',
      paymentStatus: orderData?.paymentStatus || 'pending',
      paymentMethod: orderData?.paymentMethod || 'unknown',
    } as Order;

    console.log('✅ Order processed successfully:', {
      id: order.id,
      orderNumber: order.orderNumber,
      itemsCount: order.items.length,
      total: order.total
    });

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error('❌ Get order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📝 Order update API called for ID:', params.id);
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const orderId = params.id;
    const body = await request.json();

    console.log('📝 Update data:', body);

    // Siparişin var olup olmadığını kontrol et
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('orders').doc(orderId).update(updateData);

    console.log('✅ Order updated successfully');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Sipariş başarıyla güncellendi',
    });

  } catch (error) {
    console.error('❌ Update order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş güncellenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}

// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const { status, updatedBy } = await request.json();

    if (!status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Durum bilgisi gerekli',
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçersiz durum',
      }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(params.id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Admin',
    };

    // Add delivery timestamp for delivered orders
    if (status === 'delivered') {
      updateData.deliveredAt = new Date().toISOString();
    }

    await orderRef.update(updateData);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Sipariş durumu güncellendi',
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Sipariş durumu güncellenirken bir hata oluştu',
    }, { status: 500 });
  }
}