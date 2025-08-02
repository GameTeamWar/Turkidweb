// components/ProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductWithOptions extends Product {
  selectedOptions?: string[];
  optionsData?: Array<{
    id: string;
    name: string;
    type: 'radio' | 'checkbox' | 'select';
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    choices: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
}

interface ProductCardProps {
  product: ProductWithOptions;
  onAddToCart: (product: ProductWithOptions, options?: Record<string, string>) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [optionPrices, setOptionPrices] = useState<Record<string, number>>({});

  // Calculate total price including options
  const getTotalPrice = () => {
    const basePrice = product.price;
    const optionsPrice = Object.values(optionPrices).reduce((sum, price) => sum + price, 0);
    return basePrice + optionsPrice;
  };

  const handleOptionChange = (optionId: string, choiceId: string, choiceName: string, choicePrice: number) => {
    const option = product.optionsData?.find(opt => opt.id === optionId);
    
    if (!option) {
      console.error('Option not found:', optionId);
      return;
    }

    console.log(`🔧 Option Change: ${option.name}`, {
      type: option.type,
      minSelect: option.minSelect,
      maxSelect: option.maxSelect,
      currentSelections: selectedOptions[optionId],
      newChoice: choiceName
    });

    if (option.type === 'radio') {
      setSelectedOptions(prev => ({
        ...prev,
        [optionId]: choiceId
      }));
      setOptionPrices(prev => ({
        ...prev,
        [optionId]: choicePrice
      }));
    } else if (option.type === 'checkbox') {
      const currentSelections = selectedOptions[optionId] ? selectedOptions[optionId].split(',') : [];
      const currentPrices = optionPrices[optionId] || 0;
      
      console.log(`📊 Checkbox Logic:`, {
        currentSelections,
        currentCount: currentSelections.length,
        maxSelect: option.maxSelect,
        isSelected: currentSelections.includes(choiceId)
      });
      
      if (currentSelections.includes(choiceId)) {
        // Seçimi kaldır
        const newSelections = currentSelections.filter(s => s !== choiceId);
        setSelectedOptions(prev => ({
          ...prev,
          [optionId]: newSelections.join(',')
        }));
        setOptionPrices(prev => ({
          ...prev,
          [optionId]: Math.max(0, currentPrices - choicePrice)
        }));
        console.log(`➖ Removed selection: ${choiceName}`);
      } else {
        // Yeni seçim ekle (max kontrol)
        if (currentSelections.length < option.maxSelect) {
          const newSelections = [...currentSelections, choiceId];
          setSelectedOptions(prev => ({
            ...prev,
            [optionId]: newSelections.join(',')
          }));
          setOptionPrices(prev => ({
            ...prev,
            [optionId]: currentPrices + choicePrice
          }));
          console.log(`➕ Added selection: ${choiceName}, New count: ${newSelections.length}/${option.maxSelect}`);
        } else {
          console.log(`❌ Max selection reached: ${currentSelections.length}/${option.maxSelect}`);
        }
      }
    } else if (option.type === 'select') {
      setSelectedOptions(prev => ({
        ...prev,
        [optionId]: choiceId
      }));
      setOptionPrices(prev => ({
        ...prev,
        [optionId]: choicePrice
      }));
    }
  };

  // Seçeneklerin görüntüleme isimlerini al
  const getDisplayName = (optionId: string, choiceId: string) => {
    const option = product.optionsData?.find(opt => opt.id === optionId);
    if (!option) return choiceId;
    
    const choice = option.choices.find(c => c.id === choiceId);
    return choice ? choice.name : choiceId;
  };

  // Seçeneklerin görüntüleme metinlerini hazırla
  const getSelectedOptionsDisplay = () => {
    const display: Record<string, string> = {};
    
    Object.entries(selectedOptions).forEach(([optionId, value]) => {
      const option = product.optionsData?.find(opt => opt.id === optionId);
      if (!option || !value) return;
      
      if (option.type === 'checkbox') {
        // Çoklu seçim için ID'leri isimlere çevir
        const choiceIds = value.split(',').filter(Boolean);
        const choiceNames = choiceIds.map(id => getDisplayName(optionId, id));
        display[option.name] = choiceNames.join(', ');
      } else {
        // Tek seçim için ID'yi isme çevir
        display[option.name] = getDisplayName(optionId, value);
      }
    });
    
    return display;
  };

  const handleAddToCart = () => {
    if (product.optionsData && product.optionsData.length > 0) {
      if (!validateRequiredOptions()) {
        setShowOptions(true);
        return;
      }
      // Görüntüleme isimleriyle sepete ekle
      onAddToCart(product, getSelectedOptionsDisplay());
    } else {
      onAddToCart(product);
    }
    setShowOptions(false);
  };

  const validateRequiredOptions = () => {
    if (!product.optionsData) return true;
    
    for (const option of product.optionsData) {
      if (option.isRequired && !selectedOptions[option.id]) {
        return false;
      }
    }
    return true;
  };

  const hasOptions = product.optionsData && product.optionsData.length > 0;

  console.log('🔧 ProductCard Real Options Check:', {
    productName: product.name,
    hasRealOptions: hasOptions,
    optionsCount: product.optionsData?.length || 0,
    optionsData: product.optionsData
  });

  return (
    <>
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-48">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.discount > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                %{product.discount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-white/80 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          {/* SADECE gerçek opsiyonlar varsa göster */}
          {hasOptions ? (
            <div className="mb-3 p-3 bg-white/10 rounded-lg border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 text-sm font-medium">⚙️ Özelleştirilebilir</span>
              </div>
              <div className="space-y-1">
                {product.optionsData?.map(option => (
                  <div key={option.id} className="text-white/70 text-xs flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${option.isRequired ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                    <span className="font-medium">{option.name}</span>
                    <span className="text-white/50">
                      ({option.choices.length} seçenek)
                    </span>
                    {option.isRequired && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Opsiyon yoksa debug bilgisi göster */
            <div className="mb-3 p-2 bg-gray-500/10 rounded text-xs text-gray-400">
              Bu üründe özel seçenek bulunmuyor
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white font-bold text-xl">{product.price.toFixed(2)} ₺</span>
            {product.originalPrice && (
              <span className="text-white/60 line-through text-sm">
                {product.originalPrice.toFixed(2)} ₺
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={hasOptions ? () => setShowOptions(true) : handleAddToCart}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>🛒</span>
            {hasOptions ? 'Seçenekleri Gör' : 'Sepete Ekle'}
          </button>
        </div>
      </div>

      {/* Options Modal */}
      {showOptions && hasOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-semibold">{product.name} - Seçenekler</h3>
              <button
                onClick={() => setShowOptions(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {product.optionsData?.map(option => (
                <div key={option.id} className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{option.name}</h4>
                      {option.isRequired && (
                        <span className="text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded">*Zorunlu</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        option.type === 'radio' ? 'bg-blue-500/20 text-blue-300' :
                        option.type === 'checkbox' ? 'bg-green-500/20 text-green-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {option.type === 'radio' ? 'Tek Seçim' :
                         option.type === 'checkbox' ? 'Çoklu Seçim' : 'Açılır Liste'}
                      </span>
                      <span className="text-white/60 text-xs">
                        {option.minSelect}-{option.maxSelect} seçim
                      </span>
                    </div>
                  </div>
                  
                  {option.type === 'select' ? (
                    // Açılır liste için select element
                    <select
                      value={selectedOptions[option.id] || ''}
                      onChange={(e) => {
                        const selectedChoice = option.choices.find(c => c.id === e.target.value); // Choice ID ile bul
                        if (selectedChoice) {
                          handleOptionChange(option.id, selectedChoice.id, selectedChoice.name, selectedChoice.price);
                        }
                      }}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        {option.isRequired ? 'Seçim yapın...' : 'Seçim yapmak istemiyorum'}
                      </option>
                      {option.choices.map(choice => (
                        <option key={choice.id} value={choice.id} className="bg-gray-800 text-white"> {/* Choice ID kullan */}
                          {choice.name} {choice.price > 0 ? `(+${choice.price.toFixed(2)} ₺)` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Radio ve checkbox için normal liste
                    <div className="space-y-2">
                      {option.choices.map(choice => {
                        const isSelected = option.type === 'radio' 
                          ? selectedOptions[option.id] === choice.id // Choice ID ile karşılaştır
                          : selectedOptions[option.id]?.includes(choice.id); // Choice ID ile karşılaştır
                        
                        const currentSelections = selectedOptions[option.id] ? selectedOptions[option.id].split(',') : [];
                        const isDisabled = option.type === 'checkbox' && 
                                         !isSelected && 
                                         currentSelections.length >= option.maxSelect;

                        return (
                          <label
                            key={choice.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              isDisabled 
                                ? 'bg-white/5 opacity-50 cursor-not-allowed' 
                                : isSelected
                                  ? 'bg-orange-500/20 border border-orange-500/50'
                                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={option.type === 'radio' ? 'radio' : 'checkbox'}
                                name={option.type === 'radio' ? option.id : undefined}
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => !isDisabled && handleOptionChange(option.id, choice.id, choice.name, choice.price)}
                                className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                              />
                              <span className="text-white">{choice.name}</span>
                            </div>
                            {choice.price > 0 && (
                              <span className="text-green-400 font-medium">+{choice.price.toFixed(2)} ₺</span>
                            )}
                          </label>
                        );
                      })}
                      
                      {/* Checkbox için seçim limitini göster */}
                      {option.type === 'checkbox' && (
                        <div className="text-white/60 text-xs mt-2 flex items-center gap-2">
                          <span>Seçili: {selectedOptions[option.id] ? selectedOptions[option.id].split(',').length : 0}/{option.maxSelect}</span>
                          {option.minSelect > 0 && (
                            <span className="text-yellow-400">
                              (En az {option.minSelect} seçim gerekli)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Price */}
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-orange-500/30">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-white">Toplam Fiyat:</span>
                <div className="text-right">
                  <div className="text-orange-400 text-xl">{getTotalPrice().toFixed(2)} ₺</div>
                  {Object.values(optionPrices).reduce((sum, price) => sum + price, 0) > 0 && (
                    <div className="text-white/60 text-sm">
                      Ana fiyat: {product.price.toFixed(2)} ₺ + Ek: {Object.values(optionPrices).reduce((sum, price) => sum + price, 0).toFixed(2)} ₺
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Messages */}
            {!validateRequiredOptions() && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <div className="text-red-300 text-sm font-medium mb-1">⚠️ Zorunlu seçimler eksik:</div>
                <ul className="text-red-200 text-xs space-y-1">
                  {product.optionsData?.filter(option => option.isRequired && !selectedOptions[option.id])
                    .map(option => (
                      <li key={option.id}>• {option.name}</li>
                    ))
                  }
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOptions(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-medium transition-colors duration-300"
              >
                İptal
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!validateRequiredOptions()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <span>🛒</span>
                Sepete Ekle - {getTotalPrice().toFixed(2)} ₺
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}