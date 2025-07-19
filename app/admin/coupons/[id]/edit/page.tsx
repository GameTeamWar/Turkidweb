'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CouponForm } from '@/components/admin/CouponForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EditCouponPage() {
  const params = useParams();
  const couponId = params.id as string;
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (couponId) {
      fetchCoupon();
    }
  }, [couponId]);

  const fetchCoupon = async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`);
      const result = await response.json();
      
      if (result.success) {
        setCoupon(result.data);
      } else {
        toast.error('Kupon bulunamadı');
      }
    } catch (error) {
      console.error('Coupon fetch error:', error);
      toast.error('Kupon yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-white text-xl font-semibold mb-2">Kupon bulunamadı</h2>
        <Link
          href="/admin/coupons"
          className="text-white/70 hover:text-white transition-colors"
        >
          ← Kuponlara geri dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons"
          className="text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Kupon Düzenle</h1>
          <p className="text-white/70 mt-1">
            {coupon.name} kuponunu düzenleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <CouponForm couponId={couponId} initialData={coupon} />
    </div>
  );
}
