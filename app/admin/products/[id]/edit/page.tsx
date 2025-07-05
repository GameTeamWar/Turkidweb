// app/admin/products/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/types';
import { ProductForm } from '@/components/admin/ProductForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}`);
      const result = await response.json();
      
      if (result.success) {
        setProduct(result.data);
      } else {
        setError(result.error || 'Ürün bulunamadı');
        toast.error(result.error || 'Ürün yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      setError('Ürün yüklenirken hata oluştu');
      toast.error('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-white text-xl font-semibold mb-2">Ürün bulunamadı</h3>
        <p className="text-white/60 mb-6">{error || 'Bu ürün mevcut değil veya silinmiş olabilir'}</p>
        <button
          onClick={() => window.history.back()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return <ProductForm product={product} isEdit={true} />;
}