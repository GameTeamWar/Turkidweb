// app/admin/products/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      const result = await response.json();
      
      if (result.success) {
        setProduct(result.data);
      } else {
        toast.error('Ürün bulunamadı');
      }
    } catch (error) {
      console.error('Product fetch error:', error);
      toast.error('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-white text-xl font-semibold mb-2">Ürün bulunamadı</h2>
        <Link
          href="/admin/products"
          className="text-white/70 hover:text-white transition-colors"
        >
          ← Ürünlere geri dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Ürün Düzenle</h1>
          <p className="text-white/70 mt-1">
            {product.name} ürününü düzenleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm productId={productId} initialData={product} />
    </div>
  );
}