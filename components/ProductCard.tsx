// components/ProductCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, options?: Record<string, string>) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Opsiyonları normalize etme ve başlatma
  useEffect(() => {
    if (!product) return;

    const defaults: Record<string, string> = {};
    
    // Opsiyonları düzgün bir formata getirme
    const normalizedOptions = normalizeOptions(product.options);
    
    normalizedOptions.forEach(option => {
      if (option.values.length > 0) {
        defaults[option.key] = option.values[0].value;
      }
    });

    setSelectedOptions(defaults);
  }, [product]);

  // Opsiyon verisini normalize eden yardımcı fonksiyon
  const normalizeOptions = (options: any): Array<{
    key: string;
    name: string;
    values: Array<{ value: string; label: string }>
  }> => {
    if (!options) return [];
    
    // Eğer zaten doğru formattaysa
    if (Array.isArray(options) && options.every(opt => opt.name && opt.values)) {
      return options.map(opt => ({
        key: opt.name,
        name: opt.label || opt.name,
        values: opt.values.map(val => ({
          value: val.value,
          label: val.label || val.value
        }))
      }));
    }

    // Firebase'den gelen farklı formatlar için dönüşümler
    try {
      // Format 1: { spice: ["mild", "medium"], sauce: ["ketchup", "mayo"] }
      if (typeof options === 'object' && !Array.isArray(options)) {
        return Object.entries(options).map(([key, values]) => ({
          key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          values: (Array.isArray(values) ? values : [values]).map(val => ({
            value: val,
            label: typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1) : String(val)
          }))
        }));
      }

      // Format 2: ["spice", "sauce"] gibi basit array
      if (Array.isArray(options) && options.every(opt => typeof opt === 'string')) {
        return options.map(opt => ({
          key: opt,
          name: opt.charAt(0).toUpperCase() + opt.slice(1),
          values: [
            { value: 'default', label: 'Default' }
          ]
        }));
      }
    } catch (error) {
      console.error('Error normalizing options:', error);
    }

    return [];
  };

  const handleOptionChange = (optionKey: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionKey]: value,
    }));
  };

  const handleAddToCart = () => {
    const normalizedOptions = normalizeOptions(product.options);
    const hasOptions = normalizedOptions.length > 0;
    
    onAddToCart(product, hasOptions ? selectedOptions : undefined);
  };

  const renderOptions = () => {
    const normalizedOptions = normalizeOptions(product.options);
    
    if (normalizedOptions.length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-white/10 rounded-lg space-y-4">
        {normalizedOptions.map(option => (
          <div key={option.key}>
            <h4 className="text-white font-medium mb-2">{option.name}</h4>
            <div className="flex gap-3 flex-wrap">
              {option.values.map(value => (
                <label key={`${option.key}-${value.value}`} className="flex items-center gap-1 text-white text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`${option.key}-${product.id}`}
                    value={value.value}
                    checked={selectedOptions[option.key] === value.value}
                    onChange={(e) => handleOptionChange(option.key, e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span>{value.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!product) {
    return (
      <div className="bg-white/10 border border-white/20 rounded-xl p-5 text-center">
        <p className="text-white">Ürün bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <div className="relative h-48 w-full">
        <Image
          src={product.image || '/default-product.png'}
          alt={product.name || "Ürün"}
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
        <h3 className="text-white text-lg font-semibold mb-2">
          {product.name || "İsimsiz Ürün"}
        </h3>
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {product.description || "Açıklama yok"}
        </p>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white text-xl font-bold">
            {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'} ₺
          </span>
          {product.originalPrice && (
            <span className="text-white/60 text-base line-through">
              {product.originalPrice.toFixed(2)} ₺
            </span>
          )}
        </div>
        
        {renderOptions()}
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-white text-orange-500 py-3 px-4 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-colors duration-300"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}