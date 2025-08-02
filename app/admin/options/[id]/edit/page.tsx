'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { OptionsForm } from '@/components/admin/OptionsForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EditOptionPage() {
  const params = useParams();
  const optionId = params.id as string;
  const [option, setOption] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (optionId) {
      fetchOption();
    }
  }, [optionId]);

  const fetchOption = async () => {
    try {
      const response = await fetch(`/api/admin/options/${optionId}`);
      const result = await response.json();
      
      if (result.success) {
        setOption(result.data);
      } else {
        toast.error('Opsiyon bulunamadı');
      }
    } catch (error) {
      console.error('Option fetch error:', error);
      toast.error('Opsiyon yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!option) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-white text-xl font-semibold mb-2">Opsiyon bulunamadı</h2>
        <Link
          href="/admin/options"
          className="text-white/70 hover:text-white transition-colors"
        >
          ← Opsiyonlara geri dön
        </Link>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">Opsiyon Düzenle</h1>
          <p className="text-white/70 mt-1">
            {option.name} opsiyonunu düzenleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <OptionsForm optionId={optionId} initialData={option} />
    </div>
  );
}
