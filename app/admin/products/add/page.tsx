// app/admin/products/add/page.tsx
'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddProductPage() {
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
          <h1 className="text-3xl font-bold text-white">Yeni Ürün Ekle</h1>
          <p className="text-white/70 mt-1">
            Menüye yeni bir ürün ekleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm />
    </div>
  );
}