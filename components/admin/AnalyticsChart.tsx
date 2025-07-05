// components/admin/AnalyticsChart.tsx
'use client';

import { useMemo } from 'react';

interface AnalyticsChartProps {
  data: any[];
  type: 'revenue' | 'orders';
}

export function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { maxValue: 0, items: [] };
    
    const valueKey = type === 'revenue' ? 'revenue' : 'orders';
    const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
    
    return { maxValue, items: data };
  }, [data, type]);

  const formatValue = (value: number) => {
    if (type === 'revenue') {
      return `₺${value.toLocaleString()}`;
    }
    return value.toString();
  };

  const formatLabel = (item: any) => {
    if (item.month) {
      return new Date(item.month).toLocaleDateString('tr-TR', { month: 'short' });
    }
    if (item.date) {
      return new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
    return '';
  };

  if (chartData.items.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-white/60">
        Veri bulunamadı
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="h-full flex items-end gap-2">
        {chartData.items.map((item, index) => {
          const valueKey = type === 'revenue' ? 'revenue' : 'orders';
          const value = item[valueKey] || 0;
          const height = chartData.maxValue > 0 ? (value / chartData.maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t-lg transition-all duration-700 ease-out relative group cursor-pointer ${
                  type === 'revenue' 
                    ? 'bg-gradient-to-t from-green-500 to-green-400' 
                    : 'bg-gradient-to-t from-blue-500 to-blue-400'
                }`}
                style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0px' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {formatValue(value)}
                </div>
              </div>
              <div className="text-white/60 text-xs text-center">
                {formatLabel(item)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}