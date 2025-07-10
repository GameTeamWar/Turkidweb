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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();
    const { orderIds, targetDate } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli sipariş IDs gerekli',
      }, { status: 400 });
    }

    console.log(`📦 Moving ${orderIds.length} orders to history for date: ${targetDate}`);

    const batch = adminDb.batch();
    let movedCount = 0;

    for (const orderId of orderIds) {
      try {
        // Mevcut siparişi al
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          
          // Geçmişe taşı
          const historyData = {
            ...orderData,
            originalOrderId: orderId,
            movedToHistoryAt: new Date().toISOString(),
            movedBy: session.user?.name || 'Admin',
            historyDate: targetDate || new Date().toISOString().split('T')[0],
            isArchived: true
          };

          // order_history koleksiyonuna ekle
          const historyRef = adminDb.collection('order_history').doc();
          batch.set(historyRef, historyData);

          // Orijinal siparişi sil
          batch.delete(adminDb.collection('orders').doc(orderId));
          
          movedCount++;
        }
      } catch (error) {
        console.error(`Error moving order ${orderId}:`, error);
      }
    }

    await batch.commit();

    console.log(`✅ Successfully moved ${movedCount} orders to history`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${movedCount} sipariş geçmişe taşındı`,
      data: { movedCount }
    });

  } catch (error) {
    console.error('❌ Move to history error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Siparişler geçmişe taşınırken hata: ${error.message}`,
    }, { status: 500 });
  }
}

// Otomatik günlük sıfırlama
export async function GET(request: NextRequest) {
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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'auto-cleanup') {
      // Restoran açılış/kapanış saatleri (ayarlanabilir)
      const OPENING_HOUR = 9; // 09:00
      const CLOSING_HOUR = 23; // 23:00
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Kapanış saatinden sonra veya açılış saatinden önce ise otomatik temizlik yap
      if (currentHour >= CLOSING_HOUR || currentHour < OPENING_HOUR) {
        // Teslim edilmiş ve iptal edilmiş siparişleri geçmişe taşı
        const completedOrdersQuery = await adminDb
          .collection('orders')
          .where('status', 'in', ['delivered', 'cancelled'])
          .get();

        if (!completedOrdersQuery.empty) {
          const orderIds = completedOrdersQuery.docs.map(doc => doc.id);
          
          // Move to history fonksiyonunu çağır
          const moveRequest = new Request(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderIds,
              targetDate: now.toISOString().split('T')[0]
            })
          });

          return this.POST(moveRequest);
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Otomatik temizlik tamamlandı',
        data: { cleaned: false, reason: 'Çalışma saatleri içinde' }
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Geçersiz action parametresi',
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Auto cleanup error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Otomatik temizlik hatası: ${error.message}`,
    }, { status: 500 });
  }
}