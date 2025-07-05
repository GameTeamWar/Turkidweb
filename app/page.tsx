// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
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

const categories: Category[] = [
  { id: 'all', name: 'Popüler Ürünler', slug: 'all', icon: '🔥', isActive: true, sortOrder: 0 },
  { id: 'et-burger', name: 'Et Burger', slug: 'et-burger', icon: '🍔', isActive: true, sortOrder: 1 },
  { id: 'tavuk-burger', name: 'Tavuk Burger', slug: 'tavuk-burger', icon: '🐔', isActive: true, sortOrder: 2 },
  { id: 'izmir-kumru', name: 'İzmir Kumru', slug: 'izmir-kumru', icon: '🥖', isActive: true, sortOrder: 3 },
  { id: 'doner', name: 'Dönerler', slug: 'doner', icon: '🌯', isActive: true, sortOrder: 4 },
  { id: 'sandwich', name: 'Sandwiçler', slug: 'sandwich', icon: '🥪', isActive: true, sortOrder: 5 },
  { id: 'tost', name: 'Tostlar', slug: 'tost', icon: '🍞', isActive: true, sortOrder: 6 },
  { id: 'yan-urun', name: 'Yan Ürünler', slug: 'yan-urun', icon: '🍟', isActive: true, sortOrder: 7 },
  { id: 'icecek', name: 'İçecekler', slug: 'icecek', icon: '🥤', isActive: true, sortOrder: 8 },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [filters, setFilters] = useState<Filters>({
    vegetarian: false,
    spicy: false,
    discount: false,
    popular: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [currentCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?category=${currentCategory}&active=true`);
      const result = await response.json();
      
      if (result.success) {
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

  const filteredProducts = products.filter(product => {
    // Category filter - show popular items when "all" is selected
    if (currentCategory === 'all') {
      if (!product.tags.includes('popular') || product.category === 'icecek') {
        return false;
      }
    }
    
    // Other filters
    if (filters.vegetarian && !product.tags.includes('vegetarian')) {
      return false;
    }
    if (filters.spicy && !product.tags.includes('spicy')) {
      return false;
    }
    if (filters.discount && product.discount === 0) {
      return false;
    }
    if (filters.popular && !product.tags.includes('popular')) {
      return false;
    }
    
    return true;
  });

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
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-white text-lg py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <div>Ürün bulunamadı</div>
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