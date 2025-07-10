// app/page.tsx - Kategori filtreleme düzeltildi
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { Product, Category, Filters } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CartBadge } from '@/components/CartBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('populer');
  const [filters, setFilters] = useState<Filters>({
    vegetarian: false,
    spicy: false,
    discount: false,
    popular: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [currentCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      
      if (result.success) {
        // Admin kategorilerini kullanıcı kategorilerine dönüştür
        const userCategories = result.data
          .filter((cat: any) => cat.isActive)
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((cat: any) => ({
            id: cat.slug,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder
          }));
        
        // Popüler kategorisini başa ekle
        const popularCategory = {
          id: 'populer',
          name: 'Popüler Ürünler',
          slug: 'populer',
          icon: '🔥',
          isActive: true,
          sortOrder: 0
        };
        
        setCategories([popularCategory, ...userCategories]);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?category=${currentCategory}&active=true`);
      const result = await response.json();
      
      if (result.success) {
        console.log('📦 Fetched products:', result.data);
        console.log('🔍 Current category:', currentCategory);
        setProducts(result.data);
      } else {
        toast.error('Ürünler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Remove console logs in production
  const filteredProducts = useMemo(() => products.filter(product => {
    // Kategori filtresi - güncellenmiş mantık
    if (currentCategory === 'populer') {
      // Popüler etiketine sahip ürünleri göster
      const hasPopularTag = product.tags.includes('populer') || 
                           product.tags.includes('popular') || 
                           product.tags.includes('cok-satan');
      if (!hasPopularTag) {
        return false;
      }
    } else {
      // Seçili kategoriye ait ürünleri göster - hem categories array hem de category string kontrol et
      const isInCategory = (product.categories && product.categories.includes(currentCategory)) ||
                          (product.category === currentCategory);
      if (!isInCategory) {
        return false;
      }
    }
    
    // Diğer filtreler
    if (filters.vegetarian && !product.tags.includes('Vejetaryen')) {
      return false;
    }
    if (filters.spicy && !product.tags.includes('Acili')) {
      return false;
    }
    if (filters.discount && product.discount === 0) {
      return false;
    }
    if (filters.popular && !product.tags.includes('Populer') && !product.tags.includes('Popular') && !product.tags.includes('cok-satan')) {
      return false;
    }
    
    return true;
  }), [products, currentCategory, filters]);

  const handleAddToCart = (product: Product, options?: Record<string, string>) => {
    addItem(product, options);
    toast.success('Ürün sepete eklendi!');
  };

  const getCategoryTitle = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Ürünler';
  };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex min-h-[calc(100vh-80px)]">
        <Sidebar
          categories={categories}
          currentCategory={currentCategory}
          onCategoryChange={setCurrentCategory}
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 pt-2 px-6 pb-6 bg-white/5">
          <div className="mb-8">
            <h1 className="text-white text-3xl font-bold">
              {getCategoryTitle(currentCategory)}
            </h1>
            {currentCategory === 'populer' && (
              <p className="text-white/80 mt-2">En çok tercih edilen lezzetlerimiz</p>
            )}
            <p className="text-white/60 text-sm mt-1">
              {filteredProducts.length} ürün bulundu
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-white text-lg py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <div>Bu kategoride ürün bulunamadı</div>
              <p className="text-white/60 mt-2">
                Kategori: {currentCategory} - Lütfen başka bir kategori seçin veya filtreleri kontrol edin
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-xs text-white/80">Debug Info:</p>
                  <p className="text-xs text-white/60">Total products: {products.length}</p>
                  <p className="text-xs text-white/60">Current category: {currentCategory}</p>
                  <p className="text-xs text-white/60">Active filters: {Object.entries(filters).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'none'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CartBadge onClick={() => router.push('/cart')} />
      <Toaster position="top-right" />
    </div>
  );
}