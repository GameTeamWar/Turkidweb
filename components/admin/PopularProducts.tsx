// components/admin/PopularProducts.tsx
import { Product } from '@/types';
import Image from 'next/image';

interface PopularProductsProps {
  products: Array<{
    product: Product;
    orderCount: number;
    revenue: number;
  }>;
}

export function PopularProducts({ products }: PopularProductsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
      <h3 className="text-white text-xl font-semibold mb-6">Popüler Ürünler</h3>
      
      <div className="space-y-4">
        {products.length === 0 ? (
          <p className="text-white/60 text-center py-8">Henüz veri yok</p>
        ) : (
          products.map((item, index) => (
            <div key={item.product.id} className="flex items-center gap-4 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm">{item.product.name}</h4>
                <p className="text-white/60 text-xs">
                  {item.orderCount} sipariş • {item.revenue.toFixed(2)} ₺
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-white font-semibold">{item.product.price.toFixed(2)} ₺</div>
                <div className="text-white/60 text-xs">{item.product.category}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}