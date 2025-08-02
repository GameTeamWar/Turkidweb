// components/ProductCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product } from '@/types';

interface ProductWithOptions extends Product {
  options?: Record<string, any>;
}

interface ProductCardProps {
  product: ProductWithOptions;
  onAddToCart: (product: ProductWithOptions, options?: Record<string, string>) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Opsiyonları normalize etme - varsayılan seçim yapma
  useEffect(() => {
    if (!product) return;

    // Varsayılan seçim yapma - müşteri kendisi seçsin
    setSelectedOptions({});
  }, [product]);

  // Opsiyon verisini normalize eden yardımcı fonksiyon - Düzeltilmiş versiyon
  const normalizeOptions = (options: any): Array<{
    key: string;
    name: string;
    values: Array<{ value: string; label: string }>
  }> => {
    try {
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
    } catch (error) {
      console.error('Option normalization error:', error);
    }

    return [];
  };

  const handleOptionChange = (optionKey: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionKey]: value
    }));
  };

  const handleAddToCart = () => {
    const normalizedOptions = normalizeOptions(product.options || {});
    
    if (normalizedOptions.length > 0) {
      const missingOptions = normalizedOptions.filter(
        option => !selectedOptions[option.key]
      );

      if (missingOptions.length > 0) {
        const missingOptionNames = missingOptions.map(opt => opt.name).join(', ');
        toast.error(`Lütfen şu seçenekleri yapın: ${missingOptionNames}`, {
          duration: 4000,
          style: {
            background: 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white',
            fontWeight: 'bold'
          }
        });
        return;
      }
    }

    if (onAddToCart) {
      onAddToCart(product, selectedOptions);
    }
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

  // Opsiyonları normalize et
  const normalizedOptions = normalizeOptions(product.options || {});

  // Debug için console log ekleyelim
  useEffect(() => {
    console.log('Product:', product.name);
    console.log('Product options:', product.options || {});
    console.log('Normalized options:', normalizedOptions);
  }, [product, normalizedOptions]);

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
      {/* Image and Discount Badge */}
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
      
      {/* Content */}
      <div className="p-4">
        {/* Title and Description */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-white/70 text-sm mb-4 line-clamp-2">{product.description}</p>

        {/* Options - Opsiyonları göster */}
        {renderOptions()}
        {normalizedOptions.length > 0 && (
          <div className="mb-4 space-y-3">
            <h4 className="text-white/90 text-sm font-medium flex items-center gap-2">
              <span>🍽️</span>
              Seçenekler <span className="text-red-300 text-xs">*</span>
            </h4>
            {normalizedOptions.map((option) => (
              <div key={option.key} className="space-y-2">
                <label className="text-white/80 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                  {option.name}
                  <span className="text-red-300">*</span>
                  {!selectedOptions[option.key] && (
                    <span className="text-yellow-300 text-xs normal-case">(Seçiniz)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {option.values.map((value) => (
                    <button
                      key={value.value}
                      onClick={() => handleOptionChange(option.key, value.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedOptions[option.key] === value.value
                          ? 'bg-orange-500 text-white shadow-lg scale-105'
                          : 'bg-white/20 text-white/80 hover:bg-white/30 border border-white/40'
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Options Summary */}
        {Object.keys(selectedOptions).length > 0 && (
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-green-300 text-xs mb-2 flex items-center gap-1">
              <span>✓</span>
              Seçili Opsiyonlar:
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(selectedOptions).map(([key, value]) => (
                <span
                  key={key}
                  className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs"
                >
                  {normalizedOptions.find(opt => opt.key === key)?.name}: {
                    normalizedOptions
                      .find(opt => opt.key === key)
                      ?.values.find(val => val.value === value)?.label || value
                  }
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white font-bold text-xl">{product.price.toFixed(2)} ₺</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-white/60 line-through text-sm">
              {product.originalPrice.toFixed(2)} ₺
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
            normalizedOptions.length > 0 && Object.keys(selectedOptions).length !== normalizedOptions.length
              ? 'bg-gray-500 hover:bg-gray-600 text-white cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          <span>🛒</span>
          {normalizedOptions.length > 0 && Object.keys(selectedOptions).length !== normalizedOptions.length
            ? 'Önce Seçenekleri Seçin'
            : 'Sepete Ekle'
          }
        </button>

        {/* Missing Options Warning */}
        {normalizedOptions.length > 0 && Object.keys(selectedOptions).length < normalizedOptions.length && (
          <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="text-yellow-300 text-xs flex items-center gap-1">
              <span>⚠️</span>
              {normalizedOptions.length - Object.keys(selectedOptions).length} seçenek daha yapmalısınız
            </div>
          </div>
        )}
      </div>
    </div>
  );
}