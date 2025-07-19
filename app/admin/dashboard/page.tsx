// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { AnalyticsData } from '@/types/admin';
import { 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Toplam Gelir',
      value: `₺${analytics?.totalRevenue?.toLocaleString() || '0'}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      change: '+12.3%'
    },
    {
      name: 'Toplam Sipariş',
      value: analytics?.totalOrders?.toLocaleString() || '0',
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      change: '+8.1%'
    },
    {
      name: 'Toplam Kullanıcı',
      value: analytics?.totalUsers?.toLocaleString() || '0',
      icon: UserGroupIcon,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      change: '+5.4%'
    },
    {
      name: 'Toplam Ürün',
      value: analytics?.totalProducts?.toLocaleString() || '0',
      icon: ShoppingBagIcon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      change: '+2.1%'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 mt-2">Turkid FastFood yönetim paneline hoş geldiniz</p>
        </div>
        <div className="text-white/60 text-sm">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Aylık Gelir</h3>
          <AnalyticsChart 
            data={analytics?.monthlyRevenue || []} 
            type="revenue"
          />
        </div>

        {/* Orders Chart */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Günlük Siparişler</h3>
          <AnalyticsChart 
            data={analytics?.dailyRevenue || []} 
            type="orders"
          />
        </div>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/products/add"
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-blue-400 text-2xl mb-2">📦</div>
              <div className="text-white font-medium">Yeni Ürün</div>
            </Link>
            <Link
              href="/admin/categories/add"
              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-green-400 text-2xl mb-2">🏷️</div>
              <div className="text-white font-medium">Yeni Kategori</div>
            </Link>
            <Link
              href="/admin/coupons/add"
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-purple-400 text-2xl mb-2">🎫</div>
              <div className="text-white font-medium">Yeni Kupon</div>
            </Link>
            <Link
              href="/admin/users/add"
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-orange-400 text-2xl mb-2">👤</div>
              <div className="text-white font-medium">Yeni Kullanıcı</div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Son Siparişler</h3>
            <Link href="/admin/orders" className="text-blue-400 hover:text-blue-300 text-sm">
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-3">
            {analytics?.recentOrders?.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">#{order.orderNumber || `ORD-${order.id?.slice(-6) || 'N/A'}`}</div>
                  <div className="text-white/60 text-sm">{order.userName || 'Bilinmeyen'}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">₺{order.total?.toFixed(2) || '0.00'}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status || 'unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">En Çok Satan Ürünler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics?.topProducts?.slice(0, 6).map((item, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{item.product?.name || 'Bilinmeyen Ürün'}</div>
                  <div className="text-white/60 text-sm">{item.sales || 0} satış</div>
                </div>
                <div className="text-white font-bold">₺{item.revenue?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}