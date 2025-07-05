// components/admin/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Product } from '@/types';
import { PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProductFormProps {
  product?: Product;
  isEdit?: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  hasOptions: boolean;
  isActive: boolean;
  image: string;
  stock?: number;
}

const categories = [
  { value: 'et-burger', label: 'Et Burger' },
  { value: 'tavuk-burger', label: 'Tavuk Burger' },
  { value: 'izmir-kumru', label: 'İzmir Kumru' },
  { value: 'doner', label: 'Döner' },
  { value: 'sandwich', label: 'Sandwich' },
  { value: 'tost', label: 'Tost' },
  { value: 'yan-urun', label: 'Yan Ürün' },
  { value: 'icecek', label: 'İçecek' },
];

const availableTags = [
  'popular', 'new', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'bestseller'
];

export function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(product?.tags || []);
  const [imagePreview, setImagePreview] = useState(product?.image || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      originalPrice: product?.originalPrice || undefined,
      category: product?.category || '',
      tags: product?.tags || [],
      hasOptions: product?.hasOptions || false,
      isActive: product?.isActive ?? true,
      image: product?.image || '',
      stock: product?.stock || undefined,
    }
  });

  const watchPrice = watch('price');
  const watchOriginalPrice = watch('originalPrice');

  // Calculate discount percentage
  const discountPercentage = watchOriginalPrice && watchPrice && watchOriginalPrice > watchPrice 
    ? Math.round(((watchOriginalPrice - watchPrice) / watchOriginalPrice) * 100)
    : 0;

  // Update tags when selectedTags changes
  useEffect(() => {
    setValue('tags', selectedTags);
  }, [selectedTags, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      const productData = {
        ...data,
        tags: selectedTags,
        discount: discountPercentage,
        price: parseFloat(data.price.toString()),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice.toString()) : undefined,
        stock: data.stock ? parseInt(data.stock.toString()) : undefined,
      };

      const url = isEdit ? `/api/admin/products/${product?.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
        router.push('/admin/products');
        router.refresh();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Product form error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImagePreview(url);
    setValue('image', url);
  };

  const handleImageError = () => {
    setImagePreview('');
  };

  const resetForm = () => {
    reset();
    setSelectedTags(product?.tags || []);
    setImagePreview(product?.image || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Temel Bilgiler</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    {...register('name', { 
                      required: 'Ürün adı gerekli',
                      minLength: { value: 2, message: 'Ürün adı en az 2 karakter olmalı' },
                      maxLength: { value: 100, message: 'Ürün adı en fazla 100 karakter olabilir' }
                    })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Ürün adını girin..."
                  />
                  {errors.name && (
                    <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    {...register('description', { 
                      required: 'Açıklama gerekli',
                      minLength: { value: 10, message: 'Açıklama en az 10 karakter olmalı' },
                      maxLength: { value: 500, message: 'Açıklama en fazla 500 karakter olabilir' }
                    })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                    placeholder="Ürün açıklamasını girin..."
                  />
                  {errors.description && (
                    <p className="text-red-300 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Kategori *
                  </label>
                  <select
                    {...register('category', { required: 'Kategori seçimi gerekli' })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                  >
                    <option value="">Kategori seçin...</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-300 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Fiyatlandırma</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Satış Fiyatı (₺) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { 
                        required: 'Fiyat gerekli',
                        min: { value: 0.01, message: 'Fiyat 0\'dan büyük olmalı' },
                        max: { value: 10000, message: 'Fiyat 10.000₺\'den fazla olamaz' }
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
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('originalPrice', {
                        min: { value: 0.01, message: 'Orijinal fiyat 0\'dan büyük olmalı' },
                        max: { value: 10000, message: 'Orijinal fiyat 10.000₺\'den fazla olamaz' },
                        validate: (value) => {
                          if (value && watchPrice && value <= watchPrice) {
                            return 'Orijinal fiyat satış fiyatından büyük olmalı';
                          }
                          return true;
                        }
                      })}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="0.00"
                    />
                    {errors.originalPrice && (
                      <p className="text-red-300 text-sm mt-1">{errors.originalPrice.message}</p>
                    )}
                  </div>
                </div>

                {discountPercentage > 0 && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 font-medium">
                      İndirim: %{discountPercentage}
                    </div>
                    <div className="text-green-300 text-sm">
                      Müşteri {(watchOriginalPrice! - watchPrice).toFixed(2)} ₺ tasarruf edecek
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    {...register('stock', {
                      min: { value: 0, message: 'Stok 0\'dan küçük olamaz' },
                      max: { value: 10000, message: 'Stok 10.000\'den fazla olamaz' }
                    })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Sınırsız için boş bırakın"
                  />
                  {errors.stock && (
                    <p className="text-red-300 text-sm mt-1">{errors.stock.message}</p>
                  )}
                  <p className="text-white/60 text-sm mt-1">
                    Boş bırakırsanız sınırsız stok olarak işaretlenir
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ürün Görseli</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Görsel URL
                  </label>
                  <input
                    type="url"
                    {...register('image', {
                      pattern: {
                        value: /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i,
                        message: 'Geçerli bir görsel URL\'si girin (jpg, jpeg, png, webp, gif)'
                      }
                    })}
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.image && (
                    <p className="text-red-300 text-sm mt-1">{errors.image.message}</p>
                  )}
                </div>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={handleImageError}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setValue('image', '');
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-white/10 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-white/40 mx-auto mb-2" />
                      <div className="text-white/60 text-sm">Görsel önizlemesi</div>
                      <div className="text-white/40 text-xs mt-1">
                        JPG, JPEG, PNG, WEBP, GIF desteklenir
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Etiketler</h3>
              
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-3 p-3 bg-white/10 rounded-lg">
                  <div className="text-white/80 text-sm mb-2">Seçilen etiketler:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                      <span key={tag} className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Seçenekler</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('hasOptions')}
                    className="w-5 h-5 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-white">Bu ürünün seçenekleri var</span>
                    <div className="text-white/60 text-sm">
                      Baharat, sos gibi seçenekler eklenebilir
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="w-5 h-5 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-white">Ürün aktif</span>
                    <div className="text-white/60 text-sm">
                      Aktif ürünler müşterilere gösterilir
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              İptal
            </button>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-6 py-3 rounded-lg font-medium transition-colors duration-300"
              >
                Sıfırla
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEdit ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                  </div>
                ) : (
                  isEdit ? 'Güncelle' : 'Kaydet'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}