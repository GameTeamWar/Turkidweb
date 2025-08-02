// app/api/admin/orders/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

interface HistoryOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  orderNote?: string;
  deliveryAddress?: any;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  movedToHistoryAt?: string;
  movedBy?: string;
  originalDate?: string;
  appliedCoupon?: any;
  discountAmount?: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Order history API called');
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    console.log('✅ Admin user authorized:', session.user?.email);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('📝 Query params:', { date, search, status, dateFrom, dateTo });
    console.log('🔗 AdminDb available:', !!adminDb);

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection not available',
      }, { status: 503 });
    }

    // Firebase'den gerçek geçmiş siparişleri getir
    console.log('🔥 Attempting to fetch from Firebase order_history collection...');
    
    let query: any = adminDb.collection('order_history');

    // Tarih filtresi
    if (date) {
      console.log('🗓️ Applying Firebase date filter:', date);
      const startOfDay = date + 'T00:00:00.000Z';
      const endOfDay = date + 'T23:59:59.999Z';
      
      // Firebase Timestamp ile çalışıyorsa
      query = query
        .where('originalDate', '>=', startOfDay)
        .where('originalDate', '<=', endOfDay);
    } else if (dateFrom && dateTo) {
      console.log('🗓️ Applying Firebase date range filter:', dateFrom, 'to', dateTo);
      query = query
        .where('originalDate', '>=', dateFrom + 'T00:00:00.000Z')
        .where('originalDate', '<=', dateTo + 'T23:59:59.999Z');
    }

    // Durum filtresi
    if (status) {
      console.log('📋 Applying Firebase status filter:', status);
      query = query.where('status', '==', status);
    }

    // Sıralama - en yeni geçmiş kayıtları önce
    query = query.orderBy('movedToHistoryAt', 'desc');

    console.log('🔍 Executing Firebase query...');
    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.docs.length} history orders from Firebase`);

    let orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Tarih alanlarını string'e çevir
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        movedToHistoryAt: data.movedToHistoryAt?.toDate ? data.movedToHistoryAt.toDate().toISOString() : data.movedToHistoryAt,
        originalDate: data.originalDate?.toDate ? data.originalDate.toDate().toISOString() : data.originalDate,
        // Items array'ini garanti et
        items: Array.isArray(data.items) ? data.items : [],
        // Sayısal alanları garanti et
        total: typeof data.total === 'number' ? data.total : 0,
        subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
        tax: typeof data.tax === 'number' ? data.tax : 0,
        discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : 0,
      };
    }) as HistoryOrder[];

    // Arama filtresi (client-side)
    if (search) {
      console.log('🔍 Applying client-side search filter:', search);
      const searchTerm = search.toLowerCase();
      orders = orders.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.userName?.toLowerCase().includes(searchTerm) ||
        order.userEmail?.toLowerCase().includes(searchTerm)
      );
      console.log('📊 Orders after search filter:', orders.length);
    }

    console.log(`✅ Returning ${orders.length} filtered Firebase history orders`);

    return NextResponse.json<ApiResponse<HistoryOrder[]>>({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('❌ Get order history error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Geçmiş siparişler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const { orderIds, targetDate } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli sipariş ID\'leri gerekli',
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    console.log('📦 Moving orders to history:', orderIds);

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
    console.log(`✅ Moved ${movedCount} orders to history`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${movedCount} sipariş geçmişe taşındı`,
      data: { movedCount }
    });

  } catch (error) {
    console.error('❌ Move to history error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Geçmişe taşıma sırasında bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const orderId = searchParams.get('orderId');

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    if (action === 'clear-all') {
      // Tüm geçmişi temizle
      const snapshot = await adminDb.collection('order_history').get();
      const batch = adminDb.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleared ${snapshot.docs.length} history orders`);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${snapshot.docs.length} geçmiş sipariş silindi`,
        data: { deletedCount: snapshot.docs.length }
      });
    }

    if (action === 'delete-single' && orderId) {
      // Tek sipariş geçmişi sil
      await adminDb.collection('order_history').doc(orderId).delete();
      console.log(`✅ Deleted history order: ${orderId}`);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Sipariş geçmişi silindi',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Geçersiz işlem',
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Delete history error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Geçmiş silme sırasında bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}