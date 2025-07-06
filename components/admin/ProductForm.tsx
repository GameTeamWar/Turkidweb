// components/admin/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Category, ProductOption, ProductChoice } from '@/types/admin';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  tags: string[];
  hasOptions: boolean;
  stock?: number;
  isActive: boolean;
  options: ProductOption[];
}

interface ProductFormProps {
  productId?: string;
  initialData?: any;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || []);
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [showOptionModal, setShowOptionModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ProductFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      originalPrice: initialData?.originalPrice || undefined,
      category: initialData?.category || '',
      image: initialData?.image || '',
      tags: initialData?.tags || [],
      hasOptions: initialData?.hasOptions || false,
      stock: initialData?.stock || undefined,
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      options: initialData?.options || [],
    }
  });

  const watchPrice = watch('price');
  const watchOriginalPrice = watch('originalPrice');
  const watchImage = watch('image');
  const watchHasOptions = watch('hasOptions');

  // Discount hesaplama
  const discount = watchOriginalPrice && watchPrice && watchOriginalPrice > watchPrice
    ? Math.round(((watchOriginalPrice - watchPrice) / watchOriginalPrice) * 100)
    : 0;

  // Available tags
  const availableTags = [
    'popular',
    'new',
    'spicy',
    'vegetarian',
    'vegan',
    'gluten-free',
    'best-seller',
    'limited',
    'hot',
    'cold'
  ];

  useEffect(() => {
    fetchCategories();
    
    // Image preview güncelle
    if (watchImage && watchImage !== imagePreview) {
      setImagePreview(watchImage);
    }
  }, [watchImage, imagePreview]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  // Opsiyon ekleme/düzenleme
  const handleAddOption = () => {
    setEditingOption({
      id: `option_${Date.now()}`,
      name: '',
      minSelect: 1,
      maxSelect: 1,
      choices: []
    });
    setShowOptionModal(true);
  };

  const handleEditOption = (option: ProductOption) => {
    setEditingOption({ ...option });
    setShowOptionModal(true);
  };

  const handleDeleteOption = (optionId: string) => {
    if (confirm('Bu opsiyonu silmek istediğinizden emin misiniz?')) {
      setOptions(options.filter(opt => opt.id !== optionId));
    }
  };

  const handleSaveOption = (option: ProductOption) => {
    if (!option.name.trim()) {
      toast.error('Opsiyon adı gerekli');
      return;
    }

    if (option.choices.length === 0) {
      toast.error('En az bir seçenek eklemelisiniz');
      return;
    }

    if (option.minSelect > option.choices.length) {
      toast.error('Minimum seçim sayısı, seçenek sayısından fazla olamaz');
      return;
    }

    if (option.maxSelect > option.choices.length) {
      toast.error('Maksimum seçim sayısı, seçenek sayısından fazla olamaz');
      return;
    }

    if (option.minSelect > option.maxSelect) {
      toast.error('Minimum seçim, maksimum seçimden fazla olamaz');
      return;
    }

    const existingIndex = options.findIndex(opt => opt.id === option.id);
    if (existingIndex >= 0) {
      const newOptions = [...options];
      newOptions[existingIndex] = option;
      setOptions(newOptions);
    } else {
      setOptions([...options, option]);
    }

    setShowOptionModal(false);
    setEditingOption(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      // Form verilerini hazırla
      const formData = {
        ...data,
        price: parseFloat(data.price.toString()),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice.toString()) : undefined,
        stock: data.stock ? parseInt(data.stock.toString()) : undefined,
        tags: selectedTags,
        discount: discount,
        options: watchHasOptions ? options : []
      };

      const url = productId 
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Response'u kontrol et
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Response'un content-type'ını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error('Server JSON formatında response döndürmedi');
      }

      // JSON parse et
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response:', textResponse);
        throw new Error('Response JSON formatında parse edilemedi');
      }

      if (result.success) {
        toast.success(productId ? 'Ürün güncellendi!' : 'Ürün eklendi!');
        router.push('/admin/products');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      // Hata tipine göre farklı mesajlar
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
      } else if (error.message.includes('JSON')) {
        toast.error('Sunucu yanıtı işlenirken hata oluştu');
      } else {
        toast.error('Bir hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {productId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <p className="text-white/70">
            Ürün bilgilerini doldurun ve kaydedin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ürün Adı */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Ürün Adı *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Ürün adı gerekli',
                  minLength: { value: 2, message: 'En az 2 karakter olmalı' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Örn: Klasik Cheeseburger"
              />
              {errors.name && (
                <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kategori *
              </label>
              <select
                {...register('category', { required: 'Kategori seçimi gerekli' })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              >
                <option value="">Kategori Seçin</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug} className="text-black">
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-300 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Açıklama * <span className="text-white/60 text-xs">(Max 3 satır)</span>
            </label>
            <textarea
              {...register('description', { 
                required: 'Açıklama gerekli',
                minLength: { value: 10, message: 'En az 10 karakter olmalı' },
                maxLength: { value: 150, message: 'En fazla 150 karakter olmalı' }
              })}
              rows={3}
              maxLength={150}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
              placeholder="Ürün açıklamasını yazın... (Max 150 karakter)"
            />
            {errors.description && (
              <p className="text-red-300 text-sm mt-1">{errors.description.message}</p>
            )}
            <div className="text-white/60 text-xs mt-1">
              {watch('description')?.length || 0}/150 karakter
            </div>
          </div>

          {/* Fiyat Bilgileri */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mevcut Fiyat */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Satış Fiyatı (₺) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { 
                  required: 'Fiyat gerekli',
                  min: { value: 0.01, message: 'Fiyat 0\'dan büyük olmalı' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-red-300 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            {/* Orijinal Fiyat */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Orijinal Fiyat (₺)
                <span className="text-white/60 text-xs ml-1">(İndirim için)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('originalPrice', {
                  min: { value: 0.01, message: 'Fiyat 0\'dan büyük olmalı' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="0.00"
              />
              {errors.originalPrice && (
                <p className="text-red-300 text-sm mt-1">{errors.originalPrice.message}</p>
              )}
            </div>

            {/* İndirim Göstergesi */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                İndirim Oranı
              </label>
              <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white flex items-center">
                {discount > 0 ? (
                  <span className="text-green-400 font-semibold">%{discount} İndirim</span>
                ) : (
                  <span className="text-white/60">İndirim yok</span>
                )}
              </div>
            </div>
          </div>

          {/* Görsel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Ürün Görseli (URL) *
              </label>
              <input
                type="url"
                {...register('image', { 
                  required: 'Görsel URL gerekli',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Geçerli bir URL girin'
                  }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="https://example.com/image.jpg"
              />
              {errors.image && (
                <p className="text-red-300 text-sm mt-1">{errors.image.message}</p>
              )}
            </div>

            {/* Stok */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Stok Adedi
                <span className="text-white/60 text-xs ml-1">(Boş bırakın: Sınırsız)</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('stock', {
                  min: { value: 0, message: 'Stok negatif olamaz' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Örn: 100"
              />
              {errors.stock && (
                <p className="text-red-300 text-sm mt-1">{errors.stock.message}</p>
              )}
            </div>
          </div>

          {/* Görsel Önizleme */}
          {imagePreview && (
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <PhotoIcon className="w-5 h-5" />
                Görsel Önizleme
              </h4>
              <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden mx-auto">
                <Image
                  src={imagePreview}
                  alt="Ürün önizleme"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => {
                    setImagePreview('');
                    toast.error('Görsel yüklenemedi');
                  }}
                />
              </div>
            </div>
          )}

          {/* Etiketler */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Etiketler
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {availableTags.map(tag => (
                <label key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-white text-sm capitalize">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ürün Seçenekleri */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasOptions')}
                  className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-white text-sm">
                  Bu ürünün seçenekleri var
                </span>
              </label>
              
              {watchHasOptions && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Opsiyon Ekle
                </button>
              )}
            </div>

            {/* Mevcut Opsiyonlar */}
            {watchHasOptions && options.length > 0 && (
              <div className="space-y-3">
                {options.map(option => (
                  <div key={option.id} className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{option.name}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditOption(option)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(option.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-white/70 text-sm mb-2">
                      Min: {option.minSelect} | Max: {option.maxSelect}
                    </div>
                    <div className="space-y-1">
                      {option.choices.map(choice => (
                        <div key={choice.id} className="text-white/80 text-sm">
                          • {choice.name} {choice.price ? `(+₺${choice.price})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktif Durum */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-white text-sm">
                Ürün aktif (satışa açık)
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {productId ? 'Güncelleniyor...' : 'Ekleniyor...'}
                </div>
              ) : (
                productId ? 'Ürünü Güncelle' : 'Ürünü Ekle'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
            >
              İptal
            </button>

            {!productId && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedTags([]);
                  setImagePreview('');
                  setOptions([]);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Temizle
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Opsiyon Modal */}
      {showOptionModal && editingOption && (
        <OptionModal
          option={editingOption}
          onSave={handleSaveOption}
          onClose={() => {
            setShowOptionModal(false);
            setEditingOption(null);
          }}
        />
      )}
    </div>
  );
}

// Opsiyon Modal Bileşeni
interface OptionModalProps {
  option: ProductOption;
  onSave: (option: ProductOption) => void;
  onClose: () => void;
}

function OptionModal({ option, onSave, onClose }: OptionModalProps) {
  const [currentOption, setCurrentOption] = useState<ProductOption>({ ...option });
  const [newChoice, setNewChoice] = useState({ name: '', price: 0 });

  const handleAddChoice = () => {
    if (!newChoice.name.trim()) {
      toast.error('Seçenek adı gerekli');
      return;
    }

    const choice: ProductChoice = {
      id: `choice_${Date.now()}`,
      name: newChoice.name.trim(),
      price: newChoice.price > 0 ? newChoice.price : undefined
    };

    setCurrentOption({
      ...currentOption,
      choices: [...currentOption.choices, choice]
    });

    setNewChoice({ name: '', price: 0 });
  };

  const handleDeleteChoice = (choiceId: string) => {
    setCurrentOption({
      ...currentOption,
      choices: currentOption.choices.filter(c => c.id !== choiceId)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Opsiyon Düzenle</h3>

        {/* Opsiyon Adı */}
        <div className="mb-4">
          <label className="block text-white text-sm font-medium mb-2">
            Opsiyon Adı *
          </label>
          <input
            type="text"
            value={currentOption.name}
            onChange={(e) => setCurrentOption({ ...currentOption, name: e.target.value })}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            placeholder="Örn: Baharat Seçimi"
          />
        </div>

        {/* Min/Max Seçim */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Min Seçim *
            </label>
            <input
              type="number"
              min="0"
              value={currentOption.minSelect}
              onChange={(e) => setCurrentOption({ ...currentOption, minSelect: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Max Seçim *
            </label>
            <input
              type="number"
              min="1"
              value={currentOption.maxSelect}
              onChange={(e) => setCurrentOption({ ...currentOption, maxSelect: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
            />
          </div>
        </div>

        {/* Seçenekler */}
        <div className="mb-4">
          <label className="block text-white text-sm font-medium mb-2">
            Seçenekler
          </label>
          
          {/* Mevcut Seçenekler */}
          <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
            {currentOption.choices.map(choice => (
              <div key={choice.id} className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                <span className="text-white text-sm">
                  {choice.name} {choice.price ? `(+₺${choice.price})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteChoice(choice.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Yeni Seçenek Ekleme */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Seçenek adı"
              value={newChoice.name}
              onChange={(e) => setNewChoice({ ...newChoice, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ek ücret (₺)"
                value={newChoice.price}
                onChange={(e) => setNewChoice({ ...newChoice, price: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              />
              <button
                type="button"
                onClick={handleAddChoice}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-300"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={() => onSave(currentOption)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-300"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-300"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}