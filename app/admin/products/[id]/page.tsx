// app/admin/products/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      setError('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product || !confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Ürün silindi');
        router.push('/admin/products');
      } else {
        toast.error(result.error || 'Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProduct(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        toast.success(product.isActive ? 'Ürün deaktif edildi' : 'Ürün aktif edildi');
      } else {
        toast.error(result.error || 'Ürün durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle product error:', error);
      toast.error('Ürün durumu güncellenirken hata oluştu');
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
        <Link
          href="/admin/products"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const categories = {
    'et-burger': 'Et Burger',
    'tavuk-burger': 'Tavuk Burger',
    'izmir-kumru': 'İzmir Kumru',
    'doner': 'Döner',
    'sandwich': 'Sandwich',
    'tost': 'Tost',
    'yan-urun': 'Yan Ürün',
    'icecek': 'İçecek',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Ürün Detayı</h1>
            <p className="text-white/70 mt-1">#{product.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
              product.isActive
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
          >
            {product.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            {product.isActive ? 'Aktif' : 'Pasif'}
          </button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Düzenle
          </Link>
          <button
            onClick={handleDeleteProduct}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Sil
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="relative h-96 rounded-lg overflow-hidden mb-4">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {product.discount > 0 && (
              <div className="absolute top-4 right-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  %{product.discount} İndirim
                </span>
              </div>
            )}
          </div>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{product.name}</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-4">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-white/60 text-sm">Kategori</span>
                <div className="text-white font-medium">
                  {categories[product.category as keyof typeof categories] || product.category}
                </div>
              </div>
              <div>
                <span className="text-white/60 text-sm">Durum</span>
                <div className={`font-medium ${product.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {product.isActive ? 'Aktif' : 'Pasif'}
                </div>
              </div>
            </div>

            {product.stock !== undefined && (
              <div className="mb-4">
                <span className="text-white/60 text-sm">Stok</span>
                <div className="text-white font-medium">
                  {product.stock > 0 ? `${product.stock} adet` : 'Tükendi'}
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Fiyatlandırma</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-white text-2xl font-bold">{product.price.toFixed(2)} ₺</span>
                {product.originalPrice && (
                  <span className="text-white/60 line-through text-lg">
                    {product.originalPrice.toFixed(2)} ₺
                  </span>
                )}
              </div>

              {product.discount > 0 && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-green-400 font-medium mb-2">İndirim Detayları</div>
                  <div className="text-green-300 text-sm space-y-1">
                    <div>İndirim Oranı: %{product.discount}</div>
                    <div>Tasarruf: {((product.originalPrice || 0) - product.price).toFixed(2)} ₺</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ürün Seçenekleri</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Seçenekleri var</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.hasOptions 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {product.hasOptions ? 'Evet' : 'Hayır'}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ürün Bilgileri</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Oluşturulma</span>
                <span className="text-white">
                  {new Date(product.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Son Güncelleme</span>
                <span className="text-white">
                  {new Date(product.updatedAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}