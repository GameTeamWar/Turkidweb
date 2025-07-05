// app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product, ProductFilters, ApiResponse } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    isActive: undefined,
    hasStock: undefined,
    hasDiscount: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchProducts();
  }, [session, status, router, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.hasStock !== undefined) queryParams.append('hasStock', filters.hasStock.toString());
      if (filters.hasDiscount !== undefined) queryParams.append('hasDiscount', filters.hasDiscount.toString());
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/admin/products?${queryParams}`);
      const result: ApiResponse<Product[]> = await response.json();
      
      if (result.success) {
        // Gelen verilerin tags array'ini garanti et
        const safeProducts = (result.data || []).map(product => ({
          ...product,
          tags: Array.isArray(product.tags) ? product.tags : [],
          options: Array.isArray(product.options) ? product.options : [],
        }));
        setProducts(safeProducts);
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

  const handleBulkAction = async (action: string) => {
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

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? 
      <ArrowUpIcon className="w-4 h-4" /> : 
      <ArrowDownIcon className="w-4 h-4" />;
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
              <h1 className="text-white text-3xl font-bold mb-2">Ürün Yönetimi</h1>
              <p className="text-white/80">
                Toplam {products.length} ürün • {selectedProducts.length} seçili
              </p>
            </div>
            <Link
              href="/admin/products/add"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Yeni Ürün
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
                <option value="">Tüm Kategoriler</option>
                <option value="et-burger">Et Burger</option>
                <option value="tavuk-burger">Tavuk Burger</option>
                <option value="izmir-kumru">İzmir Kumru</option>
                <option value="doner">Döner</option>
                <option value="sandwich">Sandwich</option>
                <option value="tost">Tost</option>
                <option value="yan-urun">Yan Ürün</option>
                <option value="icecek">İçecek</option>
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
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">
                {selectedProducts.length} ürün seçili
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

        {/* Products Table */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Görsel</th>
                  <th 
                    className="px-6 py-4 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors duration-300"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Ürün Adı
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Kategori</th>
                  <th 
                    className="px-6 py-4 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors duration-300"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-2">
                      Fiyat
                      <SortIcon field="price" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Durum</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Stok</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors duration-300">
                    <td className="px-6 py-4">
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
                        className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="text-white font-semibold">{product.name}</h3>
                        <p className="text-white/60 text-sm line-clamp-1">{product.description}</p>
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {product.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 2 && (
                              <span className="text-white/60 text-xs">+{product.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{product.price.toFixed(2)} ₺</span>
                        {product.originalPrice && (
                          <span className="text-white/60 line-through text-sm">
                            {product.originalPrice.toFixed(2)} ₺
                          </span>
                        )}
                        {product.discount > 0 && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            %{product.discount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                          product.isActive
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                        }`}
                      >
                        {product.isActive ? (
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
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        (product.stock || 0) > 10
                          ? 'bg-green-500/20 text-green-300'
                          : (product.stock || 0) > 0
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {product.stock !== undefined ? `${product.stock} adet` : 'Sınırsız'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-300"
                          title="Düzenle"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-300"
                          title="Sil"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-white text-xl font-semibold mb-2">Ürün bulunamadı</h3>
              <p className="text-white/60 mb-6">
                {filters.search || filters.category 
                  ? 'Arama kriterlerinize uygun ürün bulunamadı'
                  : 'Henüz hiç ürün eklenmemiş'
                }
              </p>
              <Link
                href="/admin/products/add"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                İlk Ürünü Ekle
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Toplam Ürün</p>
                <p className="text-white text-2xl font-bold">{products.length}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Aktif Ürün</p>
                <p className="text-white text-2xl font-bold">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">İndirimli Ürün</p>
                <p className="text-white text-2xl font-bold">
                  {products.filter(p => p.discount > 0).length}
                </p>
              </div>
              <div className="text-3xl">🏷️</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Ortalama Fiyat</p>
                <p className="text-white text-2xl font-bold">
                  {products.length > 0 
                    ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)
                    : '0.00'
                  } ₺
                </p>
              </div>
              <div className="text-3xl">💰</div>
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