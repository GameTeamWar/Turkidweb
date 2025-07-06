// app/admin/categories/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category } from '@/types/admin';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchCategory(params.id as string);
    }
  }, [params.id]);

  const fetchCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      const result = await response.json();
      
      if (result.success) {
        setCategory(result.data);
      } else {
        setError(result.error || 'Kategori bulunamadı');
      }
    } catch (error) {
      console.error('Fetch category error:', error);
      setError('Kategori yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!category || !confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Kategori silindi');
        router.push('/admin/categories');
      } else {
        toast.error(result.error || 'Kategori silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('Kategori silinirken hata oluştu');
    }
  };

  const handleToggleActive = async () => {
    if (!category) return;

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCategory(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        toast.success(category.isActive ? 'Kategori deaktif edildi' : 'Kategori aktif edildi');
      } else {
        toast.error(result.error || 'Kategori durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle category error:', error);
      toast.error('Kategori durumu güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-white text-xl font-semibold mb-2">Kategori bulunamadı</h3>
        <p className="text-white/60 mb-6">{error || 'Bu kategori mevcut değil veya silinmiş olabilir'}</p>
        <Link
          href="/admin/categories"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Kategorilere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Kategori Detayı</h1>
            <p className="text-white/70 mt-1">#{category.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
              category.isActive
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
          >
            {category.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            {category.isActive ? 'Aktif' : 'Pasif'}
          </button>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Düzenle
          </Link>
          <button
            onClick={handleDeleteCategory}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Sil
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Kategori Bilgileri</h2>
          
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">{category.icon}</div>
              <h3 className="text-2xl font-bold text-white">{category.name}</h3>
            </div>

            <div>
              <span className="text-white/60 text-sm">Slug</span>
              <div className="text-white font-medium">
                <code className="bg-white/20 text-orange-300 px-2 py-1 rounded text-sm">
                  {category.slug}
                </code>
              </div>
            </div>

            {category.description && (
              <div>
                <span className="text-white/60 text-sm">Açıklama</span>
                <div className="text-white font-medium">{category.description}</div>
              </div>
            )}

            <div>
              <span className="text-white/60 text-sm">Sıralama</span>
              <div className="text-white font-medium">{category.sortOrder}</div>
            </div>

            <div>
              <span className="text-white/60 text-sm">Durum</span>
              <div className={`font-medium ${category.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {category.isActive ? 'Aktif' : 'Pasif'}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">İstatistikler</h3>
          
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Toplam Ürün</span>
                <span className="text-blue-400 font-bold text-xl">0</span>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Aktif Ürün</span>
                <span className="text-green-400 font-bold text-xl">0</span>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Bu Ay Satış</span>
                <span className="text-purple-400 font-bold text-xl">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Kategori Geçmişi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Oluşturulma</span>
            <span className="text-white">
              {new Date(category.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Son Güncelleme</span>
            <span className="text-white">
              {new Date(category.updatedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}