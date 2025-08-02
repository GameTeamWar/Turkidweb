// app/api/admin/orders/route.ts - Sadece gerçek data
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Order } from '@/types';
import type { Session } from 'next-auth';

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
        error: 'Database connection not available',
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('🔍 Fetching orders from Firebase...');

    // Firebase'den gerçek veri çek
    let query: any = adminDb.collection('orders');

    // Filtreleri uygula
    if (status) {
      query = query.where('status', '==', status);
    }
    if (paymentStatus) {
      query = query.where('paymentStatus', '==', paymentStatus);
    }
    if (paymentMethod) {
      query = query.where('paymentMethod', '==', paymentMethod);
    }
    if (dateFrom) {
      query = query.where('createdAt', '>=', dateFrom);
    }
    if (dateTo) {
      query = query.where('createdAt', '<=', dateTo + 'T23:59:59Z');
    }

    // Sıralama - en yeni siparişler önce
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.docs.length} orders`);

    let orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Tarih alanlarını string'e çevir
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        // Items array'ini garanti et
        items: Array.isArray(data.items) ? data.items : [],
        // Sayısal alanları garanti et
        total: typeof data.total === 'number' ? data.total : 0,
        subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
        tax: typeof data.tax === 'number' ? data.tax : 0,
      };
    }) as Order[];

    // Arama filtresi (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      orders = orders.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.userName?.toLowerCase().includes(searchTerm) ||
        order.userEmail?.toLowerCase().includes(searchTerm)
      );
    }

    console.log(`✅ Returning ${orders.length} filtered orders`);

    return NextResponse.json<ApiResponse<Order[]>>({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('❌ Get orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Siparişler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}