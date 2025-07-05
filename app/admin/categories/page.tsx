// app/admin/categories/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types/admin';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      } else {
        toast.error(result.error || 'Kategoriler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Kategori silindi');
        fetchCategories();
      } else {
        toast.error(result.error || 'Kategori silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('Kategori silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Kategori deaktif edildi' : 'Kategori aktif edildi');
        fetchCategories();
      } else {
        toast.error(result.error || 'Kategori durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle category error:', error);
      toast.error('Kategori durumu güncellenirken hata oluştu');
    }
  };

  const handleReorderCategory = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const currentCategory = categories.find(c => c.id === categoryId);
      if (!currentCategory) return;

      const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
      
      if (direction === 'up' && currentIndex === 0) return;
      if (direction === 'down' && currentIndex === sortedCategories.length - 1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetCategory = sortedCategories[targetIndex];

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sortOrder: targetCategory.sortOrder,
          swapWith: targetCategory.id
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchCategories();
      } else {
        toast.error(result.error || 'Sıralama güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Reorder category error:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Kategori Yönetimi</h1>
          <p className="text-white/70 mt-2">Toplam {categories.length} kategori</p>
        </div>
        <Link
          href="/admin/categories/add"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Kategori
        </Link>
      </div>

      {/* Categories Table */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Sıra</th>
                <th className="px-6 py-4 text-left text-white font-semibold">İkon</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Kategori Adı</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Slug</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Durum</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Ürün Sayısı</th>
                <th className="px-6 py-4 text-center text-white font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedCategories.map((category, index) => (
                <tr key={category.id} className="hover:bg-white/5 transition-colors duration-300">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{category.sortOrder}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleReorderCategory(category.id, 'up')}
                          disabled={index === 0}
                          className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReorderCategory(category.id, 'down')}
                          disabled={index === sortedCategories.length - 1}
                          className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-2xl">{category.icon}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-semibold">{category.name}</div>
                      {category.description && (
                        <div className="text-white/60 text-sm mt-1">{category.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-white/20 text-orange-300 px-2 py-1 rounded text-sm">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(category.id, category.isActive)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                        category.isActive
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                      }`}
                    >
                      {category.isActive ? (
                        <>
                          <EyeIcon className="w-4 h-4" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="w-4 h-4" />
                          Pasif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">0 ürün</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                        title="Düzenle"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors duration-300"
                        title="Sil"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-white text-xl font-semibold mb-2">Kategori bulunamadı</h3>
            <p className="text-white/60 mb-6">Henüz hiç kategori oluşturulmamış</p>
            <Link
              href="/admin/categories/add"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              İlk Kategoriyi Oluştur
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Kategori</div>
          <div className="text-white text-2xl font-bold">{categories.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Aktif Kategori</div>
          <div className="text-white text-2xl font-bold">{categories.filter(c => c.isActive).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Pasif Kategori</div>
          <div className="text-white text-2xl font-bold">{categories.filter(c => !c.isActive).length}</div>
        </div>
      </div>
    </div>
  );
}