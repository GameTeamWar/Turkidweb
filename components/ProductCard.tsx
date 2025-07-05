// components/ProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, options?: Record<string, string>) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    spice: 'baharatsiz',
    sauce: 'ketcap',
  });

  const handleOptionChange = (type: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleAddToCart = () => {
    onAddToCart(product, product.hasOptions ? selectedOptions : undefined);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in">
      <div className="relative h-48 w-full">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            %{product.discount} İndirim
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-white text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-4">{product.description}</p>
        
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-white text-xl font-bold">{product.price.toFixed(2)} ₺</span>
          {product.originalPrice && (
            <span className="text-white/60 text-base line-through">
              {product.originalPrice.toFixed(2)} ₺
            </span>
          )}
        </div>
        
        {product.hasOptions && (
          <div className="mb-4 p-4 bg-white/10 rounded-lg space-y-4">
            {/* Baharat Seçimi */}
            <div>
              <h4 className="text-white font-medium mb-2">Baharat Seçimi</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`spice-${product.id}`}
                    value="baharatli"
                    checked={selectedOptions.spice === 'baharatli'}
                    onChange={(e) => handleOptionChange('spice', e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>Baharatlı</span>
                </label>
                <label className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`spice-${product.id}`}
                    value="baharatsiz"
                    checked={selectedOptions.spice === 'baharatsiz'}
                    onChange={(e) => handleOptionChange('spice', e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>Baharatsız</span>
                </label>
              </div>
            </div>
            
            {/* Sos Seçimi */}
            <div>
              <h4 className="text-white font-medium mb-2">Sos Seçimi</h4>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`sauce-${product.id}`}
                    value="ketcap"
                    checked={selectedOptions.sauce === 'ketcap'}
                    onChange={(e) => handleOptionChange('sauce', e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>Ketçap</span>
                </label>
                <label className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`sauce-${product.id}`}
                    value="mayonez"
                    checked={selectedOptions.sauce === 'mayonez'}
                    onChange={(e) => handleOptionChange('sauce', e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>Mayonez</span>
                </label>
                <label className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`sauce-${product.id}`}
                    value="sos-istemiyorum"
                    checked={selectedOptions.sauce === 'sos-istemiyorum'}
                    onChange={(e) => handleOptionChange('sauce', e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>Sos İstemiyorum</span>
                </label>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-white text-orange-500 py-3 px-4 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}