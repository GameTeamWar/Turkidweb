// app/api/admin/analytics/route.ts - Sadece gerçek data
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { AnalyticsData } from '@/types/admin';
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
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    console.log('📊 Fetching analytics from Firebase...');

    // Firebase'den gerçek veri çek
    const [ordersSnapshot, usersSnapshot, productsSnapshot] = await Promise.all([
      adminDb.collection('orders').get(),
      adminDb.collection('users').get(),
      adminDb.collection('products').get()
    ]);

    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === 'number' ? data.total : 0,
      };
    });

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
    }));

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📈 Processing analytics: ${orders.length} orders, ${users.length} users, ${products.length} products`);

    // Analitik verilerini hesapla
    const validOrders = orders.filter(order => order.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalProducts = products.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Aylık gelir hesapla
    const monthlyData = new Map();
    validOrders.forEach((order: any) => {
      if (order.createdAt) {
        const month = order.createdAt.substring(0, 7); // YYYY-MM
        const current = monthlyData.get(month) || { revenue: 0, orders: 0 };
        monthlyData.set(month, {
          revenue: current.revenue + (order.total || 0),
          orders: current.orders + 1
        });
      }
    });

    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Son 12 ay

    // Günlük gelir hesapla (son 30 gün)
    const dailyData = new Map();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    validOrders.forEach((order: any) => {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= thirtyDaysAgo) {
          const date = order.createdAt.split('T')[0]; // YYYY-MM-DD
          const current = dailyData.get(date) || { revenue: 0, orders: 0 };
          dailyData.set(date, {
            revenue: current.revenue + (order.total || 0),
            orders: current.orders + 1
          });
        }
      }
    });

    const dailyRevenue = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // En çok satan ürünler
    const productSales = new Map();
    validOrders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.id) {
            const current = productSales.get(item.id) || { sales: 0, revenue: 0 };
            productSales.set(item.id, {
              sales: current.sales + (item.quantity || 0),
              revenue: current.revenue + (item.price * item.quantity || 0)
            });
          }
        });
      }
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, stats]) => {
        const product = products.find((p: any) => p.id === productId);
        return {
          product: product ? {
            id: product.id,
            name: product.name || 'Bilinmeyen Ürün',
            price: product.price || 0
          } : {
            id: productId,
            name: 'Silinmiş Ürün',
            price: 0
          },
          ...stats
        };
      })
      .filter(item => item.product)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Son siparişler
    const recentOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10)
      .map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id?.slice(-6)}`,
        userName: order.userName || 'Bilinmeyen Kullanıcı',
        total: order.total || 0,
        status: order.status || 'unknown',
        createdAt: order.createdAt || new Date().toISOString()
      }));

    // Kullanıcı istatistikleri
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const newUsers = users.filter((user: any) => 
      user.createdAt && user.createdAt >= thirtyDaysAgoStr
    ).length;
    
    const activeUsers = users.filter((user: any) => 
      user.lastLogin && user.lastLogin >= thirtyDaysAgoStr
    ).length;
    
    const returningUsers = users.filter((user: any) => {
      const userOrders = orders.filter((order: any) => order.userEmail === user.email);
      return userOrders.length > 1;
    }).length;

    const analyticsData: AnalyticsData = {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      averageOrderValue,
      monthlyRevenue,
      dailyRevenue,
      topProducts,
      recentOrders,
      userStats: {
        newUsers,
        activeUsers,
        returningUsers
      }
    };

    console.log('✅ Analytics calculated successfully');

    return NextResponse.json<ApiResponse<AnalyticsData>>({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('❌ Get analytics error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Analitik veriler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}