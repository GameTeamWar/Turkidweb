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
          id: 'Populer',
          name: 'Popüler Ürünler',
          slug: 'Populer',
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
      console.log('🚀 Starting to fetch products for category:', currentCategory);
      
      const response = await fetch(`/api/products?category=${currentCategory}&active=true`);
      const result = await response.json();
      
      console.log('📦 API Response:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        category: currentCategory
      });
      
      if (result.success) {
        console.log('📦 Fetched products:', result.data);
        
        // İlk 3 ürünün opsiyon bilgilerini detaylı göster
        result.data?.slice(0, 3).forEach((product: any, index: number) => {
          console.log(`🔍 Product ${index + 1} options detail:`, {
            name: product.name,
            hasOptionsData: !!product.optionsData,
            optionsDataCount: product.optionsData?.length || 0,
            optionsData: product.optionsData,
            hasSelectedOptions: !!product.selectedOptions,
            selectedOptions: product.selectedOptions
          });
        });
        
        setProducts(result.data);
      } else {
        console.error('❌ API Error:', result.error);
        toast.error('Ürünler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('❌ Fetch products error:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Remove console logs in production
  const filteredProducts = useMemo(() => products.filter(product => {
    // Kategori filtresi - güncellenmiş mantık
    if (currentCategory === 'Populer') {
      // Popüler etiketine sahip ürünleri göster
      const hasPopularTag = product.tags?.includes('Populer') || 
                           product.tags?.includes('Popular') || 
                           product.tags?.includes('cok-satan');
      if (!hasPopularTag) {
        return false;
      }
    } else {
      // Seçili kategoriye ait ürünleri göster - categories array kontrol et
      const isInCategory = product.categories && product.categories.includes(currentCategory);
      if (!isInCategory) {
        return false;
      }
    }
    
    // Diğer filtreler
    if (filters.vegetarian && !product.tags?.includes('Vejetaryen')) {
      return false;
    }
    if (filters.spicy && !product.tags?.includes('Acili')) {
      return false;
    }
    if (filters.discount && (product.discount || 0) === 0) {
      return false;
    }
    if (filters.popular && !product.tags?.includes('Populer') && !product.tags?.includes('Popular') && !product.tags?.includes('cok-satan')) {
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
            {currentCategory === 'Populer' && (
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
                Kategori: {currentCategory || 'Tümü'} - Lütfen başka bir kategori seçin veya filtreleri kontrol edin
              </p>
            
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