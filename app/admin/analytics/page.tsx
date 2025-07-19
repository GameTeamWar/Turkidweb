// app/admin/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { AnalyticsData } from '@/types/admin';
import { 
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analiz Raporu</h1>
          <p className="text-white/70 mt-2">Detaylı satış ve kazanç raporları</p>
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
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-white">₺{analytics?.totalRevenue?.toLocaleString() || '0'}</p>
              <p className="text-green-400 text-sm mt-1">+12.3% önceki döneme göre</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-white">{analytics?.totalOrders?.toLocaleString() || '0'}</p>
              <p className="text-blue-400 text-sm mt-1">+8.1% önceki döneme göre</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-full">
              <ShoppingBagIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Ortalama Sipariş</p>
              <p className="text-2xl font-bold text-white">₺{analytics?.averageOrderValue?.toFixed(2) || '0.00'}</p>
              <p className="text-purple-400 text-sm mt-1">+3.7% önceki döneme göre</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-full">
              <ChartBarIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Paket Sayısı</p>
              <p className="text-2xl font-bold text-white">{analytics?.totalOrders?.toLocaleString() || '0'}</p>
              <p className="text-orange-400 text-sm mt-1">+15.2% önceki döneme göre</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-full">
              <CalendarIcon className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
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

      {/* Top Products & User Stats */}
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
    </div>
  );
}