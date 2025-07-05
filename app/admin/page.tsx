// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, Product, Analytics } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatCard } from '@/components/admin/StatCard';
import { RecentOrders } from '@/components/admin/RecentOrders';
import { PopularProducts } from '@/components/admin/PopularProducts';
import { SalesChart } from '@/components/admin/SalesChart';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchAnalytics();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await fetch('/api/orders');
      const ordersResult = await ordersResponse.json();
      
      // Fetch products
      const productsResponse = await fetch('/api/products');
      const productsResult = await productsResponse.json();

      if (ordersResult.success && productsResult.success) {
        const orders = ordersResult.data as Order[];
        const products = productsResult.data as Product[];
        
        // Calculate analytics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        
        // Recent orders (last 10)
        const recentOrders = orders.slice(0, 10);
        
        // Popular products calculation
        const productSales = new Map();
        orders.forEach(order => {
          order.items.forEach(item => {
            const current = productSales.get(item.id) || { orderCount: 0, revenue: 0 };
            productSales.set(item.id, {
              orderCount: current.orderCount + item.quantity,
              revenue: current.revenue + (item.price * item.quantity),
            });
          });
        });
        
        const popularProducts = Array.from(productSales.entries())
          .map(([productId, stats]) => ({
            product: products.find(p => p.id === productId),
            ...stats,
          }))
          .filter(item => item.product)
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 5);

        // Daily stats (last 7 days)
        const dailyStats = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = orders.filter(order => 
            order.createdAt.startsWith(dateStr)
          );
          
          dailyStats.push({
            date: dateStr,
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
          });
        }

        setAnalytics({
          totalOrders,
          totalRevenue,
          popularProducts,
          recentOrders,
          dailyStats,
        });
      } else {
        toast.error('Veriler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-white text-2xl font-bold mb-4">Yetkisiz Erişim</h2>
          <p className="text-white/80 mb-6">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Admin hesabı ile giriş yapmanız gerekiyor.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
            >
              Ana Sayfaya Dön
            </Link>
            <Link 
              href="/auth/signin"
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-white/80">
            Hoş geldiniz, {session.user?.name}. İşte bugünkü özet:
          </p>
        </div>

        {analytics && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Toplam Sipariş"
                value={analytics.totalOrders.toString()}
                icon="📋"
                color="blue"
              />
              <StatCard
                title="Toplam Gelir"
                value={`${analytics.totalRevenue.toFixed(2)} ₺`}
                icon="💰"
                color="green"
              />
              <StatCard
                title="Popüler Ürün"
                value={analytics.popularProducts.length.toString()}
                icon="🍔"
                color="orange"
              />
              <StatCard
                title="Bugünkü Sipariş"
                value={analytics.dailyStats[6]?.orders.toString() || '0'}
                icon="🎯"
                color="purple"
              />
            </div>

            {/* Charts and Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <SalesChart data={analytics.dailyStats} />
              <PopularProducts products={analytics.popularProducts} />
            </div>

            {/* Recent Orders */}
            <RecentOrders orders={analytics.recentOrders} />
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-white text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/products"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🍔</div>
                <h3 className="text-white font-semibold mb-2">Ürün Yönetimi</h3>
                <p className="text-white/80 text-sm">Ürün ekle, düzenle veya sil</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📋</div>
                <h3 className="text-white font-semibold mb-2">Sipariş Yönetimi</h3>
                <p className="text-white/80 text-sm">Siparişleri görüntüle ve yönet</p>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
                <h3 className="text-white font-semibold mb-2">Detaylı Analiz</h3>
                <p className="text-white/80 text-sm">Satış raporları ve istatistikler</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Performance Tips */}
        {analytics && analytics.totalOrders === 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4">🚀 İlk Adımlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-white/80 text-sm">
                <h4 className="font-medium mb-2">Ürün Ekleyin</h4>
                <p>Menünüze ürün ekleyerek müşterilerin sipariş verebilmesini sağlayın.</p>
              </div>
              <div className="text-white/80 text-sm">
                <h4 className="font-medium mb-2">Test Siparişi</h4>
                <p>Sistemi test etmek için örnek bir sipariş oluşturun.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}