// components/admin/CategoryForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Category } from '@/types/admin';
import toast from 'react-hot-toast';

interface CategoryFormProps {
  category?: Category;
  isEdit?: boolean;
}

interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

const commonIcons = [
  '🍔', '🐔', '🥖', '🌯', '🥪', '🍞', '🍟', '🥤',
  '🍕', '🌮', '🥙', '🍗', '🥩', '🧀', '🥓', '🍳',
  '🥗', '🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑'
];

export function CategoryForm({ category, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      icon: category?.icon || '🍔',
      description: category?.description || '',
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder || 0,
    }
  });

  const watchName = watch('name');
  const watchIcon = watch('icon');

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit || !category?.slug) {
      setValue('slug', generateSlug(name));
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);

      const url = isEdit ? `/api/admin/categories/${category?.id}` : '/api/admin/categories';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
        router.push('/admin/categories');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Category form error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 space-y-6">
          {/* Preview */}
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">{watchIcon}</div>
            <div className="text-white font-medium">{watchName || 'Kategori Adı'}</div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kategori Adı *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Kategori adı gerekli',
                  onChange: handleNameChange
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Kategori adını girin..."
              />
              {errors.name && (
                <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Slug *
              </label>
              <input
                type="text"
                {...register('slug', { 
                  required: 'Slug gerekli',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Slug sadece küçük harf, rakam ve tire içerebilir'
                  }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="kategori-slug"
              />
              {errors.slug && (
                <p className="text-red-300 text-sm mt-1">{errors.slug.message}</p>
              )}
              <p className="text-white/60 text-sm mt-1">
                URL'de kullanılacak benzersiz kimlik
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                İkon *
              </label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {commonIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={`p-3 rounded-lg text-2xl transition-colors ${
                      watchIcon === icon
                        ? 'bg-orange-500/30 border-2 border-orange-500'
                        : 'bg-white/10 hover:bg-white/20 border-2 border-transparent'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                {...register('icon', { required: 'İkon gerekli' })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Veya emoji girin..."
              />
              {errors.icon && (
                <p className="text-red-300 text-sm mt-1">{errors.icon.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Açıklama
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                placeholder="Kategori açıklaması (isteğe bağlı)..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Sıralama
                </label>
                <input
                  type="number"
                  {...register('sortOrder', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Sıralama 0\'dan küçük olamaz' }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                  placeholder="0"
                />
                {errors.sortOrder && (
                  <p className="text-red-300 text-sm mt-1">{errors.sortOrder.message}</p>
                )}
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="w-5 h-5 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <span className="text-white font-medium">Kategori aktif</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              İptal
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
      </form>
    </div>
  );
}