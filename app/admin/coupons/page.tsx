// app/admin/coupons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coupon, ApiResponse } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  PercentIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchCoupons();
  }, [session, status, router]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/coupons');
      const result: ApiResponse<Coupon[]> = await response.json();
      
      if (result.success) {
        setCoupons(result.data || []);
      } else {
        toast.error(result.error || 'Kuponlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch coupons error:', error);
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

  const handleBulkAction = async (action: string) => {
    if (selectedCoupons.length === 0) {
      toast.error('Lütfen en az bir kupon seçin');
      return;
    }

    if (!confirm(`Seçili ${selectedCoupons.length} kupon için ${action} işlemini yapmak istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch('/api/admin/coupons/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponIds: selectedCoupons,
          action: action,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`${selectedCoupons.length} kupon başarıyla güncellendi`);
        setSelectedCoupons([]);
        fetchCoupons();
      } else {
        toast.error(result.error || 'Toplu işlem sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Toplu işlem sırasında hata oluştu');
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.name.toLowerCase().includes(search.toLowerCase()) ||
    coupon.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) return 'bg-gray-500/20 text-gray-300';
    if (now < validFrom) return 'bg-blue-500/20 text-blue-300';
    if (now > validUntil) return 'bg-red-500/20 text-red-300';
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'bg-orange-500/20 text-orange-300';
    return 'bg-green-500/20 text-green-300';
  };

  const getStatusText = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) return 'Pasif';
    if (now < validFrom) return 'Henüz Başlamadı';
    if (now > validUntil) return 'Süresi Doldu';
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'Limit Doldu';
    return 'Aktif';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Kupon Yönetimi</h1>
              <p className="text-white/80">
                Toplam {coupons.length} kupon • {selectedCoupons.length} seçili
              </p>
            </div>
            <Link
              href="/admin/coupons/add"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Yeni Kupon
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
          <div className="relative">
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

        {/* Bulk Actions */}
        {selectedCoupons.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">
                {selectedCoupons.length} kupon seçili
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Aktif Et
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Pasif Et
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
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
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                  <TagIcon className="w-6 h-6 text-orange-300" />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(coupon)}`}>
                  {getStatusText(coupon)}
                </span>
              </div>

              {/* Coupon Code */}
              <div className="text-center mb-4">
                <div className="bg-orange-500/20 border-2 border-dashed border-orange-300 rounded-lg p-4">
                  <h3 className="text-orange-300 text-2xl font-bold font-mono">{coupon.code}</h3>
                  <p className="text-white text-lg font-semibold mt-1">{coupon.name}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">İndirim:</span>
                  <div className="flex items-center gap-1">
                    <PercentIcon className="w-4 h-4 text-green-300" />
                    <span className="text-green-300 font-semibold">
                      {coupon.type === 'percentage' ? `%${coupon.value}` : `${coupon.value} ₺`}
                    </span>
                  </div>
                </div>

                {coupon.minOrderAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Min. Sipariş:</span>
                    <span className="text-white font-medium">{coupon.minOrderAmount} ₺</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Kullanım:</span>
                  <span className="text-white font-medium">
                    {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : '/∞'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    Geçerli:
                  </span>
                  <span className="text-white text-sm">
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                  </span>
                </div>

                {coupon.userSpecific && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      Özel:
                    </span>
                    <span className="text-blue-300 text-sm font-medium">
                      {coupon.userSpecific}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    coupon.isActive
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                  }`}
                >
                  {coupon.isActive ? (
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

                <Link
                  href={`/admin/coupons/${coupon.id}/edit`}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-300"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDeleteCoupon(coupon.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-300"
                  title="Sil"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
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
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              İlk Kuponu Oluştur
            </Link>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Toplam Kupon</p>
                <p className="text-white text-2xl font-bold">{coupons.length}</p>
              </div>
              <div className="text-3xl">🎫</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Aktif Kupon</p>
                <p className="text-white text-2xl font-bold">
                  {coupons.filter(c => c.isActive && new Date() <= new Date(c.validUntil)).length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Toplam Kullanım</p>
                <p className="text-white text-2xl font-bold">
                  {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Özel Kupon</p>
                <p className="text-white text-2xl font-bold">
                  {coupons.filter(c => c.userSpecific).length}
                </p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
          </div>
        </div>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}