// app/admin/categories/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      const result = await response.json();
      
      if (result.success) {
        setCategory(result.data);
      } else {
        toast.error('Kategori bulunamadı');
        router.push('/admin/categories');
      }
    } catch (error) {
      console.error('Category fetch error:', error);
      toast.error('Kategori yüklenirken hata oluştu');
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-white text-xl font-semibold mb-2">Kategori bulunamadı</h2>
        <Link
          href="/admin/categories"
          className="text-white/70 hover:text-white transition-colors"
        >
          ← Kategorilere geri dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Kategori Düzenle</h1>
          <p className="text-white/70 mt-1">
            {category.name} kategorisini düzenleyin
          </p>
        </div>
      </div>

      <CategoryForm category={category} isEdit={true} />
    </div>
  );
}