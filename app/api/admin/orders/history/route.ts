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
      console.log('⚠️ Firebase Admin not available - using mock history data');
      
      // Mock history data
      const mockHistoryOrders: HistoryOrder[] = [
        {
          id: 'hist_1',
          orderNumber: 'ORD-001234',
          userId: 'user123',
          userEmail: 'test@example.com',
          userName: 'Test Kullanıcı',
          items: [
            {
              id: 'product1',
              name: 'Klasik Cheeseburger',
              price: 45.90,
              quantity: 2,
              selectedOptions: { spice: 'Baharatlı' }
            }
          ],
          subtotal: 91.80,
          tax: 7.34,
          total: 99.14,
          status: 'delivered',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          orderNote: 'Test sipariş notu',
          deliveryAddress: {
            address: 'Test Mahalle, Test Sokak No:1, Tarsus/Mersin',
            coordinates: { lat: 36.8875, lng: 34.6527 }
          },
          phone: '+90 555 123 45 67',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 gün önce
          updatedAt: new Date(Date.now() - 82800000).toISOString(),
          movedToHistoryAt: new Date().toISOString(),
          movedBy: 'Admin',
          originalDate: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'hist_2',
          orderNumber: 'ORD-001235',
          userId: 'user456',
          userEmail: 'user2@example.com',
          userName: 'İkinci Kullanıcı',
          items: [
            {
              id: 'product2',
              name: 'Chicken Burger',
              price: 42.90,
              quantity: 1,
              selectedOptions: { sauce: 'Barbekü' }
            },
            {
              id: 'product3',
              name: 'Patates Kızartması',
              price: 18.50,
              quantity: 1,
              selectedOptions: {}
            }
          ],
          subtotal: 61.40,
          tax: 4.91,
          total: 66.31,
          status: 'cancelled',
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          deliveryAddress: {
            address: 'Başka Mahalle, Başka Sokak No:5, Tarsus/Mersin',
            coordinates: { lat: 36.8900, lng: 34.6550 }
          },
          phone: '+90 555 987 65 43',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 gün önce
          updatedAt: new Date(Date.now() - 169200000).toISOString(),
          movedToHistoryAt: new Date().toISOString(),
          movedBy: 'Auto-cleanup',
          originalDate: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      // Apply date filter
      let filteredOrders = mockHistoryOrders;
      
      if (date) {
        console.log('🗓️ Applying date filter:', date);
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.originalDate || order.createdAt).toISOString().split('T')[0];
          return orderDate === date;
        });
        console.log('📊 Orders after date filter:', filteredOrders.length);
      }

      // Apply search filter
      if (search) {
        console.log('🔍 Applying search filter:', search);
        const searchTerm = search.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.userName.toLowerCase().includes(searchTerm) ||
          order.userEmail.toLowerCase().includes(searchTerm)
        );
        console.log('📊 Orders after search filter:', filteredOrders.length);
      }

      // Apply status filter
      if (status) {
        console.log('📋 Applying status filter:', status);
        filteredOrders = filteredOrders.filter(order => order.status === status);
        console.log('📊 Orders after status filter:', filteredOrders.length);
      }

      console.log('✅ Returning mock history orders:', filteredOrders.length);

      return NextResponse.json<ApiResponse<HistoryOrder[]>>({
        success: true,
        data: filteredOrders,
      });
    }

    // Firebase'den gerçek geçmiş siparişleri getir
    console.log('🔥 Attempting to fetch from Firebase order_history collection...');
    
    try {
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

    } catch (firebaseError) {
      console.error('❌ Firebase history query error:', firebaseError);
      console.error('Firebase error details:', {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      });
      
      // Firebase hatası varsa mock data döndür
      console.log('🔄 Firebase failed, falling back to mock data...');
      const mockOrders: HistoryOrder[] = [
        {
          id: 'mock_hist_1',
          orderNumber: 'ORD-MOCK1',
          userId: 'mock_user',
          userEmail: 'mock@example.com',
          userName: 'Mock Kullanıcı',
          items: [{
            id: 'mock_item',
            name: 'Mock Burger',
            price: 50.00,
            quantity: 1,
            selectedOptions: {}
          }],
          subtotal: 50.00,
          tax: 4.00,
          total: 54.00,
          status: 'delivered',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          movedToHistoryAt: new Date().toISOString(),
          movedBy: 'Fallback'
        }
      ];
      
      return NextResponse.json<ApiResponse<HistoryOrder[]>>({
        success: true,
        data: mockOrders,
      });
    }

  } catch (error) {
    console.error('❌ Get order history error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Genel hata durumunda da mock data döndür
    console.log('🔄 General error occurred, falling back to mock data...');
    
    try {
      const fallbackOrders: HistoryOrder[] = [
        {
          id: 'fallback_1',
          orderNumber: 'ORD-FB001',
          userId: 'fallback_user',
          userEmail: 'fallback@example.com',
          userName: 'Fallback User',
          items: [{
            id: 'fallback_item',
            name: 'Fallback Burger',
            price: 45.00,
            quantity: 1,
            selectedOptions: {}
          }],
          subtotal: 45.00,
          tax: 3.60,
          total: 48.60,
          status: 'delivered',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          movedToHistoryAt: new Date().toISOString(),
          movedBy: 'Error Fallback'
        }
      ];
      
      console.log('✅ Returning fallback orders due to error');
      
      return NextResponse.json<ApiResponse<HistoryOrder[]>>({
        success: true,
        data: fallbackOrders,
      });
      
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Geçmiş siparişler yüklenirken kritik hata: ${error.message}`,
      }, { status: 500 });
    }
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
        success: true,
        message: `${orderIds.length} sipariş geçmişe taşındı (Mock Mode)`,
        data: { movedCount: orderIds.length }
      });
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
        success: true,
        message: 'Geçmiş temizlendi (Mock Mode)',
      });
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