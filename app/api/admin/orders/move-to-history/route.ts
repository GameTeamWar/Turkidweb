// app/api/admin/orders/move-to-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
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

    const { orderIds, targetDate } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli sipariş ID\'leri gerekli',
      }, { status: 400 });
    }

    const batch = adminDb.batch();
    let movedCount = 0;

    for (const orderId of orderIds) {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        
        // Only move completed or cancelled orders
        if (['delivered', 'cancelled'].includes(orderData?.status)) {
          // Move to history collection
          const historyRef = adminDb.collection('order_history').doc(orderId);
          batch.set(historyRef, {
            ...orderData,
            movedToHistoryAt: new Date().toISOString(),
            movedBy: session.user?.name || 'Admin',
            originalDate: orderData.createdAt,
          });
          
          // Delete from active orders
          batch.delete(orderRef);
          movedCount++;
        }
      }
    }

    await batch.commit();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${movedCount} sipariş geçmişe taşındı`,
      data: { movedCount }
    });

  } catch (error) {
    console.error('Move to history error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Geçmişe taşıma sırasında bir hata oluştu',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'auto-cleanup') {
      // Auto cleanup for end of day
      if (!adminDb) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Veritabanı bağlantısı mevcut değil',
        }, { status: 500 });
      }

      const ordersSnapshot = await adminDb.collection('orders')
        .where('status', 'in', ['delivered', 'cancelled'])
        .get();

      const batch = adminDb.batch();
      let movedCount = 0;

      ordersSnapshot.docs.forEach(doc => {
        const orderData = doc.data();
        
        // Move to history
        const historyRef = adminDb.collection('order_history').doc(doc.id);
        batch.set(historyRef, {
          ...orderData,
          movedToHistoryAt: new Date().toISOString(),
          movedBy: 'Auto-cleanup',
          originalDate: orderData.createdAt,
        });
        
        // Delete from active orders
        batch.delete(doc.ref);
        movedCount++;
      });

      await batch.commit();

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${movedCount} sipariş otomatik olarak geçmişe taşındı`,
        data: { movedCount }
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Geçersiz işlem',
    }, { status: 400 });

  } catch (error) {
    console.error('Auto cleanup error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Otomatik temizlik sırasında bir hata oluştu',
    }, { status: 500 });
  }
}