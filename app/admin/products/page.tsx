// app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    isActive: undefined as boolean | undefined,
    hasDiscount: undefined as boolean | undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.hasDiscount !== undefined) queryParams.append('hasDiscount', filters.hasDiscount.toString());
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/admin/products?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        toast.error(result.error || 'Ürünler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Ürün silindi');
        fetchProducts();
      } else {
        toast.error(result.error || 'Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Ürün deaktif edildi' : 'Ürün aktif edildi');
        fetchProducts();
      } else {
        toast.error(result.error || 'Ürün durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle product error:', error);
      toast.error('Ürün durumu güncellenirken hata oluştu');
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    if (!confirm(`Seçili ${selectedProducts.length} ürün için ${action} işlemini yapmak istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          action: action,
          data
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`${selectedProducts.length} ürün başarıyla güncellendi`);
        setSelectedProducts([]);
        fetchProducts();
      } else {
        toast.error(result.error || 'Toplu işlem sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Toplu işlem sırasında hata oluştu');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { value: '', label: 'Tüm Kategoriler' },
    { value: 'et-burger', label: 'Et Burger' },
    { value: 'tavuk-burger', label: 'Tavuk Burger' },
    { value: 'izmir-kumru', label: 'İzmir Kumru' },
    { value: 'doner', label: 'Döner' },
    { value: 'sandwich', label: 'Sandwich' },
    { value: 'tost', label: 'Tost' },
    { value: 'yan-urun', label: 'Yan Ürün' },
    { value: 'icecek', label: 'İçecek' },
  ];

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
          <h1 className="text-3xl font-bold text-white">Ürün Yönetimi</h1>
          <p className="text-white/70 mt-2">
            Toplam {products.length} ürün • {selectedProducts.length} seçili
          </p>
        </div>
        <Link
          href="/admin/products/add"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Ürün
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={filters.isActive?.toString() || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value ? e.target.value === 'true' : undefined }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Durumlar</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>

            <select
              value={filters.hasDiscount?.toString() || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, hasDiscount: e.target.value ? e.target.value === 'true' : undefined }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Fiyatlar</option>
              <option value="true">İndirimli</option>
              <option value="false">Normal Fiyat</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }));
              }}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="createdAt-desc">En Yeni</option>
              <option value="createdAt-asc">En Eski</option>
              <option value="name-asc">İsim A-Z</option>
              <option value="name-desc">İsim Z-A</option>
              <option value="price-asc">Fiyat Artan</option>
              <option value="price-desc">Fiyat Azalan</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white font-medium">
              {selectedProducts.length} ürün seçili
            </span>
            <div className="flex gap-2 flex-wrap">
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
                onClick={() => {
                  const percentage = prompt('İndirim yüzdesi girin (örn: 10):');
                  if (percentage && !isNaN(Number(percentage))) {
                    handleBulkAction('addDiscount', { percentage: Number(percentage) });
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                İndirim Ekle
              </button>
              <button
                onClick={() => handleBulkAction('removeDiscount')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                İndirim Kaldır
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden hover:bg-white/20 transition-all duration-300"
          >
            {/* Image */}
            <div className="relative h-48">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              
              {/* Checkbox */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(prev => [...prev, product.id]);
                    } else {
                      setSelectedProducts(prev => prev.filter(id => id !== product.id));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-white/80 border-white/30 rounded focus:ring-orange-500"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.isActive 
                    ? 'bg-green-500/80 text-white' 
                    : 'bg-gray-500/80 text-white'
                }`}>
                  {product.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              {/* Discount Badge */}
              {product.discount > 0 && (
                <div className="absolute bottom-2 left-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    %{product.discount}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-white font-semibold mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-white/60 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              {/* Category */}
              <div className="mb-3">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                  {categories.find(c => c.value === product.category)?.label || product.category}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-bold text-lg">{product.price.toFixed(2)} ₺</span>
                {product.originalPrice && (
                  <span className="text-white/60 line-through text-sm">
                    {product.originalPrice.toFixed(2)} ₺
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(product.id, product.isActive)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-300 ${
                    product.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={product.isActive ? 'Pasif Et' : 'Aktif Et'}
                >
                  {product.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                </button>

                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDeleteProduct(product.id)}
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

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-white text-xl font-semibold mb-2">Ürün bulunamadı</h3>
          <p className="text-white/60 mb-6">
            {search || filters.category 
              ? 'Arama kriterlerinize uygun ürün bulunamadı'
              : 'Henüz hiç ürün eklenmemiş'
            }
          </p>
          <Link
            href="/admin/products/add"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            İlk Ürünü Ekle
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="text-white/80 text-sm">Toplam Ürün</div>
          <div className="text-white text-2xl font-bold">{products.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="text-white/80 text-sm">Aktif Ürün</div>
          <div className="text-white text-2xl font-bold">{products.filter(p => p.isActive).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="text-white/80 text-sm">İndirimli Ürün</div>
          <div className="text-white text-2xl font-bold">{products.filter(p => p.discount > 0).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="text-white/80 text-sm">Ortalama Fiyat</div>
          <div className="text-white text-2xl font-bold">
            ₺{products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}