'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Coupon } from '@/app/api/admin/coupons/route';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Utility functions
const isExpired = (validUntil: string) => new Date(validUntil) < new Date();
const getDiscountText = (coupon: Coupon) => 
  coupon.type === 'percentage' ? `%${coupon.value}` : `${coupon.value}₺`;
const getTypeText = (type: string) => 
  type === 'percentage' ? 'Yüzde İndirim' : 'Sabit İndirim';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/coupons');
      const result = await response.json();
      
      if (result.success) {
        setCoupons(result.data || []);
      } else {
        toast.error(result.error || 'Kuponlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Coupon fetch error:', error);
      toast.error('Kuponlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Bu kuponu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Kupon silindi');
        fetchCoupons();
      } else {
        toast.error(result.error || 'Kupon silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('Kupon silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (couponId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Kupon deaktif edildi' : 'Kupon aktif edildi');
        fetchCoupons();
      } else {
        toast.error(result.error || 'Kupon durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle coupon error:', error);
      toast.error('Kupon durumu güncellenirken hata oluştu');
    }
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      // No fetch here, just filtering
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const filteredCoupons = useMemo(() =>
    coupons.filter(coupon =>
      (coupon.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (coupon.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (coupon.description?.toLowerCase() || '').includes(search.toLowerCase())
    ), [coupons, search]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Kupon Yönetimi</h1>
          <p className="text-white/70 mt-2">
            Toplam {coupons.length} kupon • {selectedCoupons.length} seçili
          </p>
        </div>
        <Link
          href="/admin/coupons/add"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Kupon
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Kupon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="checkbox"
                  checked={selectedCoupons.includes(coupon.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCoupons(prev => [...prev, coupon.id]);
                    } else {
                      setSelectedCoupons(prev => prev.filter(id => id !== coupon.id));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-white/80 border-white/30 rounded focus:ring-orange-500"
                />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    !coupon.isActive 
                      ? 'bg-gray-500/80 text-white' 
                      : isExpired(coupon.validUntil)
                      ? 'bg-red-500/80 text-white'
                      : 'bg-green-500/80 text-white'
                  }`}>
                    {!coupon.isActive ? 'Pasif' : isExpired(coupon.validUntil) ? 'Süresi Dolmuş' : 'Aktif'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl">
                  <TicketIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{coupon.name}</h3>
                  <code className="text-orange-300 text-xs">{coupon.code}</code>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {coupon.description && (
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{coupon.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">İndirim:</span>
                  <span className="text-white font-medium">{getDiscountText(coupon)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Tip:</span>
                  <span className="text-white font-medium">{getTypeText(coupon.type)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Toplam Kullanım:</span>
                  <span>{coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</span>
                </div>
                {coupon.userUsageLimit && (
                  <div className="flex justify-between text-white/60">
                    <span>Kullanıcı Limiti:</span>
                    <span>{coupon.userUsageLimit} kez</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span>Son Geçerlilik:</span>
                  <span>{new Date(coupon.validUntil).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              {/* Validity */}
              <div className="text-xs text-white/60 mb-4">
                <div className="flex items-center gap-1 mb-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>Geçerlilik:</span>
                </div>
                <div>{new Date(coupon.validUntil).toLocaleDateString('tr-TR')}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-300 ${
                    coupon.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={coupon.isActive ? 'Pasif Et' : 'Aktif Et'}
                >
                  {coupon.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                </button>

                <Link
                  href={`/admin/coupons/${coupon.id}/edit`}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDeleteCoupon(coupon.id)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors duration-300"
                  title="Sil"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-white text-xl font-semibold mb-2">Kupon bulunamadı</h3>
          <p className="text-white/60 mb-6">
            {search 
              ? 'Arama kriterlerinize uygun kupon bulunamadı'
              : 'Henüz hiç kupon oluşturulmamış'
            }
          </p>
          <Link
            href="/admin/coupons/add"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            İlk Kuponu Oluştur
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Kupon</div>
          <div className="text-white text-2xl font-bold">{coupons.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Aktif Kupon</div>
          <div className="text-white text-2xl font-bold">{coupons.filter(c => c.isActive && !isExpired(c.validUntil)).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Süresi Dolmuş</div>
          <div className="text-white text-2xl font-bold">{coupons.filter(c => isExpired(c.validUntil)).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Kullanım</div>
          <div className="text-white text-2xl font-bold">{coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}</div>
        </div>
      </div>
    </div>
  );
}
