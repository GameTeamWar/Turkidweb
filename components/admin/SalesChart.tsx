// components/admin/SalesChart.tsx
'use client';

import { useMemo } from 'react';

interface SalesChartProps {
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { maxRevenue: 0, maxOrders: 0 };
    
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const maxOrders = Math.max(...data.map(d => d.orders));
    
    return { maxRevenue, maxOrders };
  }, [data]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
      <h3 className="text-white text-xl font-semibold mb-6">Son 7 Gün Satış Grafiği</h3>
      
      {data.length === 0 ? (
        <p className="text-white/60 text-center py-8">Henüz veri yok</p>
      ) : (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-3">Gelir (₺)</h4>
            <div className="flex items-end gap-2 h-32">
              {data.map((day, index) => {
                const height = chartData.maxRevenue > 0 ? (day.revenue / chartData.maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-white/20 rounded-t-lg relative" style={{ height: '120px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs">
                      {formatDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders Chart */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-3">Sipariş Sayısı</h4>
            <div className="flex items-end gap-2 h-20">
              {data.map((day, index) => {
                const height = chartData.maxOrders > 0 ? (day.orders / chartData.maxOrders) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-white/20 rounded-t-lg relative" style={{ height: '60px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs font-medium">
                      {day.orders}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
              <span className="text-white/80 text-sm">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
              <span className="text-white/80 text-sm">Sipariş</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}