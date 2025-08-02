'use client';

import { OptionsForm } from '@/components/admin/OptionsForm';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddOptionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/options"
          className="text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Yeni Opsiyon Ekle</h1>
          <p className="text-white/70 mt-1">
            Ürünler için yeni seçenek grubu oluşturun
          </p>
        </div>
      </div>

      {/* Form */}
      <OptionsForm />
    </div>
  );
}
