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
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        range: dateRange,
        start: selectedPeriod.start,
        end: selectedPeriod.end
      });
      
      const response = await fetch(`/api/admin/analytics?${params}`);
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
      name: 'Ortalama Sipariş',
      value: `₺${analytics?.averageOrderValue?.toFixed(2) || '0.00'}`,
      icon: ChartBarIcon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      change: '+3.7%'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 mt-2">Turkid FastFood yönetim paneli - Detaylı analiz raporları</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-4">
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setDateRange('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'day' 
                  ? 'bg-white text-orange-500' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Günlük
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'month' 
                  ? 'bg-white text-orange-500' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'year' 
                  ? 'bg-white text-orange-500' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Yıllık
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedPeriod.start}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, start: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-white">-</span>
            <input
              type="date"
              value={selectedPeriod.end}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, end: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
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
                  <p className="text-white/60 text-xs mt-1">önceki döneme göre</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Gelir Analizi</h3>
            <div className="text-white/60 text-sm">
              {dateRange === 'day' ? 'Son 30 Gün' : 
               dateRange === 'month' ? 'Son 12 Ay' : 'Son 5 Yıl'}
            </div>
          </div>
          <AnalyticsChart 
            data={dateRange === 'day' ? analytics?.dailyRevenue || [] : analytics?.monthlyRevenue || []} 
            type="revenue"
          />
        </div>

        {/* Orders Chart */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Sipariş Analizi</h3>
            <div className="text-white/60 text-sm">
              {dateRange === 'day' ? 'Son 30 Gün' : 
               dateRange === 'month' ? 'Son 12 Ay' : 'Son 5 Yıl'}
            </div>
          </div>
          <AnalyticsChart 
            data={dateRange === 'day' ? analytics?.dailyRevenue || [] : analytics?.monthlyRevenue || []} 
            type="orders"
          />
        </div>
      </div>

      {/* Quick Actions & User Stats */}
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
              href="/admin/tags/add"
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-purple-400 text-2xl mb-2">🏷️</div>
              <div className="text-white font-medium">Yeni Etiket</div>
            </Link>
            <Link
              href="/admin/orders"
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg p-4 transition-colors group"
            >
              <div className="text-orange-400 text-2xl mb-2">📋</div>
              <div className="text-white font-medium">Siparişler</div>
            </Link>
          </div>
        </div>

        {/* User Statistics */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Kullanıcı İstatistikleri</h3>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Yeni Kullanıcılar</span>
                <span className="text-green-400 font-bold">{analytics?.userStats?.newUsers || 0}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Aktif Kullanıcılar</span>
                <span className="text-blue-400 font-bold">{analytics?.userStats?.activeUsers || 0}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Geri Dönen Müşteriler</span>
                <span className="text-purple-400 font-bold">{analytics?.userStats?.returningUsers || 0}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-purple-400 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">En Çok Satan Ürünler</h3>
          <div className="space-y-4">
            {analytics?.topProducts?.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.product?.name || 'Bilinmeyen Ürün'}</div>
                    <div className="text-white/60 text-sm">{item.sales || 0} adet satıldı</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">₺{item.revenue?.toFixed(2) || '0.00'}</div>
                  <div className="text-white/60 text-sm">toplam gelir</div>
                </div>
              </div>
            ))}
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
            {analytics?.recentOrders?.slice(0, 8).map((order, index) => (
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
    </div>
  );
}