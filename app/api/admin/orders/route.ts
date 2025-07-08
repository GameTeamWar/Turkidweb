// app/api/admin/orders/route.ts
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!adminDb) {
      // Mock data for development
      const mockOrders: Order[] = [
        {
          id: 'order_1',
          orderNumber: 'ORD-001',
          userId: 'user1',
          userEmail: 'ahmet@test.com',
          userName: 'Ahmet Yılmaz',
          items: [
            {
              id: 'sample-1',
              name: 'Klasik Cheeseburger',
              description: 'Özel soslu dana eti, cheddar peyniri',
              price: 45.90,
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
              categories: ['et-burger'],
              discount: 0,
              tags: [],
              hasOptions: false,
              options: [],
              isActive: true,
              quantity: 2,
              cartKey: 'sample-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          subtotal: 91.80,
          tax: 7.34,
          total: 99.14,
          status: 'pending',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          phone: '0555 123 45 67',
          address: {
            id: 'addr1',
            title: 'Ev',
            fullAddress: 'Atatürk Mahallesi, İnönü Caddesi No:123, Mersin',
            city: 'Mersin',
            district: 'Akdeniz',
            postalCode: '33100',
            isDefault: true
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'order_2',
          orderNumber: 'ORD-002',
          userId: 'user2',
          userEmail: 'fatma@test.com',
          userName: 'Fatma Demir',
          items: [
            {
              id: 'sample-2',
              name: 'Tavuk Burger',
              description: 'Çıtır tavuk göğsü',
              price: 38.90,
              image: 'https://images.unsplash.com/photo-1606755962773-d324e1e596f3?w=400&h=300&fit=crop',
              categories: ['tavuk-burger'],
              discount: 0,
              tags: [],
              hasOptions: false,
              options: [],
              isActive: true,
              quantity: 1,
              cartKey: 'sample-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          subtotal: 38.90,
          tax: 3.11,
          total: 42.01,
          status: 'preparing',
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          phone: '0555 987 65 43',
          address: {
            id: 'addr2',
            title: 'İş',
            fullAddress: 'Çankaya Mahallesi, Ankara Caddesi No:456, Mersin',
            city: 'Mersin',
            district: 'Yenişehir',
            postalCode: '33200',
            isDefault: false
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return NextResponse.json<ApiResponse<Order[]>>({
        success: true,
        data: mockOrders,
      });
    }

    // Firebase Admin varsa gerçek data
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

    // Sıralama
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];

    // Arama filtresi (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      orders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.userName.toLowerCase().includes(searchTerm) ||
        order.userEmail.toLowerCase().includes(searchTerm)
      );
    }

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