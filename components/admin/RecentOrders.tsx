// components/admin/RecentOrders.tsx
import { Order } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
      <h3 className="text-white text-xl font-semibold mb-6">Son Siparişler</h3>
      
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-white/60 text-center py-8">Henüz sipariş yok</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">#{order.id.slice(-6)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <span className="text-white/80 text-sm">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: tr })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">{order.userName}</span>
                <span className="text-white font-semibold">{order.total.toFixed(2)} ₺</span>
              </div>
              
              <div className="text-white/60 text-sm mt-1">
                {order.items.length} ürün • {order.paymentMethod === 'card' ? 'Kart' : order.paymentMethod === 'cash' ? 'Nakit' : 'Online'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}