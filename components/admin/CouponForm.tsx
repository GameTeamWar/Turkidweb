'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Coupon } from '@/app/api/admin/coupons/route';
import { CalendarIcon, TicketIcon } from '@heroicons/react/24/outline';

interface CouponFormData {
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number; // Yeni alan
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

interface CouponFormProps {
  couponId?: string;
  initialData?: Coupon;
}

export function CouponForm({ couponId, initialData }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<CouponFormData>({
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      type: initialData?.type || 'percentage',
      value: initialData?.value || 0,
      minOrderAmount: initialData?.minOrderAmount || undefined,
      maxDiscountAmount: initialData?.maxDiscountAmount || undefined,
      usageLimit: initialData?.usageLimit || undefined,
      userUsageLimit: initialData?.userUsageLimit || undefined, // Yeni alan
      validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      description: initialData?.description || '',
    }
  });

  const watchType = watch('type');
  const watchValue = watch('value');
  const watchName = watch('name');

  // Generate coupon code from name
  const generateCouponCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8) + Math.floor(Math.random() * 100);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!couponId && !initialData?.code) {
      setValue('code', generateCouponCode(name));
    }
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true);

      // Form verilerini hazırla
      const formData = {
        ...data,
        value: parseFloat(data.value.toString()),
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount.toString()) : undefined,
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount.toString()) : undefined,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit.toString()) : undefined,
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
      };

      const url = couponId 
        ? `/api/admin/coupons/${couponId}`
        : '/api/admin/coupons';
      
      const method = couponId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        const text = await response.text();
        if (text) {
          result = JSON.parse(text);
        } else {
          throw new Error('Boş response');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Sunucu yanıtı işlenirken hata oluştu');
      }

      if (result.success) {
        toast.success(couponId ? 'Kupon güncellendi!' : 'Kupon eklendi!');
        router.push('/admin/coupons');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        toast.error('Bir hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {couponId ? 'Kupon Düzenle' : 'Yeni Kupon Ekle'}
          </h2>
          <p className="text-white/70">
            Kupon bilgilerini doldurun ve kaydedin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Preview */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <TicketIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{watchName || 'Kupon Adı'}</h3>
                <p className="text-white/80">
                  {watchType === 'percentage' 
                    ? `%${watchValue} İndirim` 
                    : `${watchValue}₺ İndirim`
                  }
                </p>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <code className="font-mono font-bold">{watch('code') || 'KUPONKODU'}</code>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kupon Adı *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Kupon adı gerekli',
                  minLength: { value: 3, message: 'En az 3 karakter olmalı' },
                  onChange: handleNameChange
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Örn: Hoşgeldin İndirimi"
              />
              {errors.name && (
                <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kupon Kodu *
              </label>
              <input
                type="text"
                {...register('code', { 
                  required: 'Kupon kodu gerekli',
                  minLength: { value: 3, message: 'En az 3 karakter olmalı' },
                  pattern: {
                    value: /^[A-Z0-9]+$/,
                    message: 'Sadece büyük harf ve rakam kullanın'
                  }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 font-mono"
                placeholder="HOSGELDIN20"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && (
                <p className="text-red-300 text-sm mt-1">{errors.code.message}</p>
              )}
            </div>
          </div>

          {/* Discount Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                İndirim Türü *
              </label>
              <select
                {...register('type', { required: 'İndirim türü gerekli' })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              >
                <option value="percentage">Yüzde İndirim (%)</option>
                <option value="fixed">Sabit İndirim (₺)</option>
              </select>
              {errors.type && (
                <p className="text-red-300 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                İndirim Miktarı *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={watchType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={watchType === 'percentage' ? '100' : undefined}
                  {...register('value', { 
                    required: 'İndirim miktarı gerekli',
                    min: { value: 0.01, message: '0\'dan büyük olmalı' },
                    max: watchType === 'percentage' ? { value: 100, message: '100\'den küçük olmalı' } : undefined
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">
                  {watchType === 'percentage' ? '%' : '₺'}
                </span>
              </div>
              {errors.value && (
                <p className="text-red-300 text-sm mt-1">{errors.value.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kullanım Limiti
              </label>
              <input
                type="number"
                min="1"
                {...register('usageLimit')}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Sınırsız"
              />
              <p className="text-white/60 text-xs mt-1">
                Boş bırakın: Sınırsız kullanım
              </p>
            </div>
          </div>

          {/* User Usage Limit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Toplam Kullanım Limiti
              </label>
              <input
                type="number"
                min="1"
                {...register('usageLimit')}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Sınırsız"
              />
              <p className="text-white/60 text-xs mt-1">
                Boş bırakın: Sınırsız toplam kullanım
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kullanıcı Başına Kullanım Limiti
              </label>
              <input
                type="number"
                min="1"
                {...register('userUsageLimit')}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Sınırsız"
              />
              <p className="text-white/60 text-xs mt-1">
                Boş bırakın: Kullanıcı başına sınırsız kullanım
              </p>
            </div>
          </div>

          {/* Order Constraints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Minimum Sipariş Tutarı (₺)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('minOrderAmount')}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Minimum yok"
              />
            </div>

            {watchType === 'percentage' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Maksimum İndirim Tutarı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('maxDiscountAmount')}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                  placeholder="Maksimum yok"
                />
              </div>
            )}
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Başlangıç Tarihi *
              </label>
              <input
                type="datetime-local"
                {...register('validFrom', { required: 'Başlangıç tarihi gerekli' })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              />
              {errors.validFrom && (
                <p className="text-red-300 text-sm mt-1">{errors.validFrom.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Bitiş Tarihi *
              </label>
              <input
                type="datetime-local"
                {...register('validUntil', { required: 'Bitiş tarihi gerekli' })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              />
              {errors.validUntil && (
                <p className="text-red-300 text-sm mt-1">{errors.validUntil.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Açıklama
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
              placeholder="Kupon hakkında açıklama..."
            />
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-white text-sm">
                Kupon aktif (kullanıma açık)
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {couponId ? 'Güncelleniyor...' : 'Ekleniyor...'}
                </div>
              ) : (
                couponId ? 'Kuponu Güncelle' : 'Kuponu Ekle'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/coupons')}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
            >
              İptal
            </button>

            {!couponId && (
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Temizle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
