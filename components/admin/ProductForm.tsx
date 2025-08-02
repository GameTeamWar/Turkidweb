// components/admin/ProductForm.tsx - Güncellenmiş Tag ve Opsiyon Sistemi
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Category, ProductOption, ProductChoice } from '@/types/admin';
import { Tag } from '@/app/api/admin/tags/route';
import { ProductOption as GlobalProductOption } from '@/app/api/admin/options/route';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categories: string[];
  image: string;
  tags: string[];
  hasOptions: boolean;
  stock?: number;
  isActive: boolean;
  selectedOptions: string[]; // Global opsiyon ID'leri
}

interface ProductFormProps {
  productId?: string;
  initialData?: any;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableOptions, setAvailableOptions] = useState<GlobalProductOption[]>([]);
  // Kategori seçimini kalıcı tut - initialData'dan al ve localStorage'a kaydet
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    // İlk olarak initialData'dan kontrol et
    if (initialData?.categories && initialData.categories.length > 0) {
      return initialData.categories;
    }
    // Sonra localStorage'dan kontrol et (sadece yeni ürün eklerken)
    if (!productId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastSelectedCategories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return initialData?.category ? [initialData.category] : [];
  });
  
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || []);
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    initialData?.selectedOptions || 
    initialData?.optionsData?.map((opt: any) => opt.id) || 
    []
  );

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
      categories: selectedCategories, // Kalıcı kategori seçimini kullan
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

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchAvailableOptions();
    
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

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      const result = await response.json();
      
      if (result.success) {
        setAvailableTags(result.data || []);
      }
    } catch (error) {
      console.error('Tags fetch error:', error);
    }
  };

  const fetchAvailableOptions = async () => {
    try {
      console.log('🔍 Fetching available options...');
      const response = await fetch('/api/admin/options');
      const result = await response.json();
      
      console.log('📦 Available options response:', result);
      
      if (result.success && result.data) {
        // Filter only active options
        const activeOptions = result.data.filter((option: any) => option.isActive);
        setAvailableOptions(activeOptions);
        console.log(`✅ Loaded ${activeOptions.length} active options out of ${result.data.length} total`);
      } else {
        console.error('❌ Failed to fetch options:', result.error);
        setAvailableOptions([]);
      }
    } catch (error) {
      console.error('❌ Available options fetch error:', error);
      setAvailableOptions([]);
      toast.error('Opsiyonlar yüklenirken hata oluştu');
    }
  };

  // Kategori seçimi kalıcı olsun
  const handleCategoryToggle = (categorySlug: string) => {
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter(c => c !== categorySlug)
      : [...selectedCategories, categorySlug];
    
    setSelectedCategories(newCategories);
    setValue('categories', newCategories);
    
    // Kategori seçimini localStorage'a kaydet (sadece yeni ürün eklerken)
    if (!productId && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedCategories', JSON.stringify(newCategories));
    }
  };

  const handleTagToggle = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug];
    
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const handleOptionToggle = (optionId: string) => {
    const newSelectedOptions = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter(id => id !== optionId)
      : [...selectedOptionIds, optionId];
    
    setSelectedOptionIds(newSelectedOptions);
    setValue('selectedOptions', newSelectedOptions);
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
        categories: selectedCategories, // Kalıcı kategori seçimini kullan
        tags: selectedTags,
        discount: discount,
        selectedOptions: selectedOptionIds, // Seçili opsiyon ID'leri
        hasOptions: selectedOptionIds.length > 0 // Otomatik hesapla
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error('Server JSON formatında response döndürmedi');
      }

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
        
        // Başarılı ekleme sonrası kategorileri temizleme - kullanıcı tercihine bırak
        // if (!productId && typeof window !== 'undefined') {
        //   localStorage.removeItem('lastSelectedCategories');
        // }
        
        router.push('/admin/products');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
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

            {/* Kategoriler */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kategoriler * <span className="text-white/60 text-xs">(Birden çok seçebilirsiniz)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-white/10 rounded-lg max-h-48 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.slug)}
                      onChange={() => handleCategoryToggle(category.slug)}
                      className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-white text-sm">{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-red-300 text-sm mt-1">En az bir kategori seçmelisiniz</p>
              )}
              {selectedCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCategories.map(categorySlug => {
                    const category = categories.find(c => c.slug === categorySlug);
                    return category ? (
                      <div key={categorySlug} className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                        {category.icon} {category.name}
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(categorySlug)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {/* Kategori kalıcılığı bilgi notu */}
              {!productId && (
                <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-blue-300 text-xs flex items-center gap-2">
                    <span>💡</span>
                    Seçtiğiniz kategoriler bir sonraki ürün eklerken hatırlanacak
                  </div>
                </div>
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
            <label className="block text-white text-sm font-medium mb-4">
              Etiketler
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableTags.filter(tag => tag.isActive).map(tag => (
                <label key={tag.id} className="flex items-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.slug)}
                    onChange={() => handleTagToggle(tag.slug)}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-xs"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.icon}
                    </div>
                    <span className="text-white text-sm">{tag.name}</span>
                  </div>
                </label>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTags.map(tagSlug => {
                  const tag = availableTags.find(t => t.slug === tagSlug);
                  return tag ? (
                    <div key={tagSlug} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>
                      {tag.icon} {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tagSlug)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Ürün Seçenekleri - YENİ SİSTEM */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white text-lg font-semibold mb-2">Ürün Seçenekleri</h3>
                <p className="text-white/60 text-sm">
                  Hazır opsiyonlardan seçim yapın. Yeni opsiyon eklemek için{' '}
                  <Link href="/admin/options" className="text-orange-400 hover:text-orange-300 underline">
                    Opsiyon Yönetimi
                  </Link>{' '}
                  sayfasını kullanın.
                </p>
              </div>
              <div className="text-white/60 text-sm">
                {availableOptions.length} opsiyon mevcut
              </div>
            </div>

            {/* Debug Info - Remove in production */}
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-blue-300 text-sm">
                🔧 Debug: {availableOptions.length} opsiyon yüklendi
              </div>
            </div>

            {/* Mevcut Opsiyonlar */}
            {availableOptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableOptions.map(option => (
                  <div key={option.id} className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptionIds.includes(option.id)}
                        onChange={() => handleOptionToggle(option.id)}
                        className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{option.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              option.type === 'radio' ? 'bg-blue-500/20 text-blue-300' :
                              option.type === 'checkbox' ? 'bg-green-500/20 text-green-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {option.type === 'radio' ? 'Tek Seçim' :
                               option.type === 'checkbox' ? 'Çoklu Seçim' : 'Açılır Liste'}
                            </span>
                            {option.isRequired && (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">
                                Zorunlu
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-white/70 text-sm mb-2">
                          Min: {option.minSelect} | Max: {option.maxSelect}
                        </div>
                        
                        <div className="space-y-1">
                          {option.choices && option.choices.slice(0, 3).map((choice: any) => (
                            <div key={choice.id} className="text-white/60 text-sm flex justify-between">
                              <span>• {choice.name}</span>
                              {choice.price > 0 && (
                                <span className="text-green-400">+₺{choice.price}</span>
                              )}
                            </div>
                          ))}
                          {option.choices && option.choices.length > 3 && (
                            <div className="text-white/50 text-xs">
                              +{option.choices.length - 3} seçenek daha...
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                <div className="text-white/60 mb-4">
                  <Cog6ToothIcon className="w-12 h-12 mx-auto mb-2" />
                  Aktif opsiyon bulunamadı
                </div>
                <p className="text-white/60 mb-4">
                  Opsiyon yönetimi sayfasından opsiyon oluşturun ve aktif duruma getirin.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/admin/options/add"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 inline-flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Yeni Opsiyon Oluştur
                  </Link>
                  <div className="text-white/60 text-sm">
                    veya mevcut opsiyonları aktif duruma getirin
                  </div>
                </div>
              </div>
            )}

            {/* Seçili Opsiyonlar Özeti */}
            {selectedOptionIds.length > 0 && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-300 font-medium mb-3 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  Seçili Opsiyonlar ({selectedOptionIds.length})
                </h4>
                <div className="space-y-2">
                  {selectedOptionIds.map(optionId => {
                    const option = availableOptions.find(opt => opt.id === optionId);
                    return option ? (
                      <div key={optionId} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                        <div>
                          <span className="text-white font-medium">{option.name}</span>
                          <span className="text-white/60 ml-2 text-sm">
                            ({option.choices.length} seçenek)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOptionToggle(optionId)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
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
                  setSelectedCategories([]);
                  setSelectedTags([]);
                  setImagePreview('');
                  setOptions([]);
                  setSelectedOptionIds([]);
                  // Kategori seçimini de temizle
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('lastSelectedCategories');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Temizle
              </button>
            )}

            {/* Kategori kalıcılığını temizleme butonu */}
            {!productId && selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([]);
                  setValue('categories', []);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('lastSelectedCategories');
                  }
                  toast.success('Kategori seçimleri temizlendi');
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Kategorileri Temizle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}