// app/api/admin/analytics/route.ts
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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!adminDb) {
      // Firebase Admin yoksa örnek data döndür
      const sampleAnalytics: AnalyticsData = {
        totalRevenue: 125650.50,
        totalOrders: 1234,
        totalUsers: 856,
        totalProducts: 45,
        averageOrderValue: 101.83,
        monthlyRevenue: [
          { month: '2024-01', revenue: 8500, orders: 85 },
          { month: '2024-02', revenue: 9200, orders: 92 },
          { month: '2024-03', revenue: 11800, orders: 118 },
          { month: '2024-04', revenue: 10300, orders: 103 },
          { month: '2024-05', revenue: 12900, orders: 129 },
          { month: '2024-06', revenue: 15200, orders: 152 },
          { month: '2024-07', revenue: 18400, orders: 184 },
          { month: '2024-08', revenue: 16700, orders: 167 },
          { month: '2024-09', revenue: 14500, orders: 145 },
          { month: '2024-10', revenue: 13200, orders: 132 },
          { month: '2024-11', revenue: 9950, orders: 99 },
          { month: '2024-12', revenue: 5000, orders: 28 },
        ],
        dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          revenue: Math.random() * 2000 + 500,
          orders: Math.floor(Math.random() * 20) + 5,
        })),
        topProducts: [
          {
            product: { id: '1', name: 'Klasik Cheeseburger', price: 45.90 },
            sales: 245,
            revenue: 11245.50
          },
          {
            product: { id: '2', name: 'Crispy Chicken Burger', price: 38.90 },
            sales: 198,
            revenue: 7702.20
          },
          {
            product: { id: '3', name: 'BBQ Burger', price: 48.90 },
            sales: 156,
            revenue: 7628.40
          },
          {
            product: { id: '4', name: 'İzmir Kumru', price: 32.90 },
            sales: 134,
            revenue: 4408.60
          },
          {
            product: { id: '5', name: 'Tavuk Döner', price: 39.90 },
            sales: 123,
            revenue: 4907.70
          }
        ],
        recentOrders: [
          {
            id: 'order1',
            orderNumber: 'ORD-001',
            userName: 'Ahmet Yılmaz',
            total: 67.80,
            status: 'delivered',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'order2',
            orderNumber: 'ORD-002',
            userName: 'Fatma Demir',
            total: 45.90,
            status: 'preparing',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'order3',
            orderNumber: 'ORD-003',
            userName: 'Mehmet Kaya',
            total: 89.50,
            status: 'confirmed',
            createdAt: new Date(Date.now() - 10800000).toISOString()
          }
        ],
        userStats: {
          newUsers: 45,
          activeUsers: 234,
          returningUsers: 89
        }
      };

      return NextResponse.json<ApiResponse<AnalyticsData>>({
        success: true,
        data: sampleAnalytics,
      });
    }

    // Firebase'den gerçek veri çek
    const ordersSnapshot = await adminDb.collection('orders').get();
    const usersSnapshot = await adminDb.collection('users').get();
    const productsSnapshot = await adminDb.collection('products').get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Analitik verilerini hesapla
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalProducts = products.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Aylık gelir hesapla
    const monthlyData = new Map();
    orders.forEach((order: any) => {
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
      .sort((a, b) => a.month.localeCompare(b.month));

    // Günlük gelir hesapla (son 30 gün)
    const dailyData = new Map();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    orders.forEach((order: any) => {
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
    orders.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const current = productSales.get(item.id) || { sales: 0, revenue: 0 };
          productSales.set(item.id, {
            sales: current.sales + item.quantity,
            revenue: current.revenue + (item.price * item.quantity)
          });
        });
      }
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, stats]) => ({
        product: products.find((p: any) => p.id === productId),
        ...stats
      }))
      .filter(item => item.product)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Son siparişler
    const recentOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Kullanıcı istatistikleri
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const newUsers = users.filter((user: any) => user.createdAt >= thirtyDaysAgoStr).length;
    const activeUsers = users.filter((user: any) => user.lastLogin && user.lastLogin >= thirtyDaysAgoStr).length;
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

    return NextResponse.json<ApiResponse<AnalyticsData>>({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Analitik veriler yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}