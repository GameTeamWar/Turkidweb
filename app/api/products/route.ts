// app/api/products/route.ts - Kategori filtreleme düzeltildi
// NOT: Bu dosya müşteri tarafı için, admin API'ları ayrı dosyalarda
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ApiResponse, Product } from '@/types';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Products API called');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const active = searchParams.get('active');
    const search = searchParams.get('search') || '';

    console.log('📝 Query params:', { category, active, search });
    console.log('🔗 AdminDb available:', !!adminDb);

    if (!adminDb) {
      console.log('⚠️ Using mock data - Firebase Admin not available');
      // Firebase Admin yoksa örnek data döndür
      const sampleProducts: Product[] = [
        {
          id: 'sample-1',
          name: 'Klasik Cheeseburger',
          description: 'Özel soslu dana eti, cheddar peyniri, marul, domates',
          price: 45.90,
          originalPrice: 52.90,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
          categories: ['et-burger', 'populer'],
          category: 'et-burger', // Geriye uyumluluk
          discount: 13,
          tags: ['populer', 'cok-satan'],
          hasOptions: true,
          options: [],
          stock: 50,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-2',
          name: 'Crispy Chicken Burger',
          description: 'Çıtır tavuk göğsü, özel sos, marul ve domates ile',
          price: 38.90,
          image: 'https://images.unsplash.com/photo-1606755962773-d324e1e596f3?w=400&h=300&fit=crop',
          categories: ['tavuk-burger', 'populer'],
          category: 'tavuk-burger',
          discount: 0,
          tags: ['populer', 'yeni'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-3',
          name: 'Özel İzmir Kumru',
          description: 'Sucuk, salam, kaşar peyniri, domates ve turşu ile geleneksel İzmir kumrusu',
          price: 32.90,
          originalPrice: 39.90,
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
          categories: ['izmir-kumru'],
          category: 'izmir-kumru',
          discount: 18,
          tags: ['populer', 'geleneksel'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-4',
          name: 'Tavuk Döner',
          description: 'Özel baharatlarla marine edilmiş tavuk döner',
          price: 39.90,
          image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
          categories: ['doner', 'populer'],
          category: 'doner',
          discount: 0,
          tags: ['populer', 'acili'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-5',
          name: 'BBQ Burger',
          description: 'Barbekü soslu dana eti, cheddar peyniri, karamelize soğan ve marul',
          price: 48.90,
          originalPrice: 55.90,
          image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
          categories: ['et-burger'],
          category: 'et-burger',
          discount: 13,
          tags: ['yeni', 'acili'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-6',
          name: 'Buffalo Chicken Burger',
          description: 'Acılı tavuk, ranch sos, marul ve domates',
          price: 41.90,
          image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
          categories: ['tavuk-burger'],
          category: 'tavuk-burger',
          discount: 0,
          tags: ['acili', 'yeni'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-7',
          name: 'Çıtır Patates',
          description: 'Altın sarısı çıtır patates kızartması',
          price: 18.90,
          originalPrice: 22.90,
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
          categories: ['yan-urun'],
          category: 'yan-urun',
          discount: 17,
          tags: ['populer', 'vejetaryen'],
          hasOptions: false,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-8',
          name: 'Kola',
          description: 'Soğuk kola, buzlu servis',
          price: 8.90,
          image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
          categories: ['icecek'],
          category: 'icecek',
          discount: 0,
          tags: ['soguk'],
          hasOptions: false,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample-9',
          name: 'Club Sandwich',
          description: 'Tavuk, jambon, marul, domates, cheddar peyniri ile üç katlı sandwich',
          price: 42.90,
          originalPrice: 48.90,
          image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop',
          categories: ['sandwich', 'populer'],
          category: 'sandwich',
          discount: 12,
          tags: ['populer', 'cok-satan'],
          hasOptions: true,
          options: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      // Kategori filtresi uygula
      let filteredProducts = sampleProducts;
      
      console.log('🔍 Filtering products for category:', category);
      
      if (category && category !== 'all') {
        if (category === 'populer') {
          // Popüler kategori için özel mantık
          filteredProducts = filteredProducts.filter(product => {
            const hasPopularTag = product.tags.includes('populer') || 
                                 product.tags.includes('popular') || 
                                 product.tags.includes('cok-satan');
            console.log(`Product ${product.name} - has popular tag: ${hasPopularTag}, tags:`, product.tags);
            return hasPopularTag;
          });
        } else {
          // Diğer kategoriler için - hem categories array hem de category string kontrol et
          filteredProducts = filteredProducts.filter(product => {
            const isInCategory = (product.categories && product.categories.includes(category)) ||
                               (product.category === category);
            console.log(`Product ${product.name} - in category ${category}: ${isInCategory}`, {
              categories: product.categories,
              category: product.category
            });
            return isInCategory;
          });
        }
      }

      // Aktif ürün filtresi
      if (active === 'true') {
        filteredProducts = filteredProducts.filter(product => product.isActive);
      }

      // Arama filtresi
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
        );
      }

      console.log(`📊 Filtered ${filteredProducts.length} products out of ${sampleProducts.length}`);

      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: filteredProducts,
      });
    }

    // Firebase Admin varsa gerçek veri getir
    console.log('🔥 Attempting Firebase query...');
    
    try {
      const buildQuery = () => {
        console.log('🏗️ Building query...');
        let queryBuilder: any = adminDb.collection('products');

        // Sadece aktif ürünleri getir (public API)
        queryBuilder = queryBuilder.where('isActive', '==', true);
        console.log('✅ Added isActive filter');

        // Sıralama - güncel ürünler önce
        queryBuilder = queryBuilder.orderBy('createdAt', 'desc');
        console.log('✅ Added sorting');
        
        return queryBuilder;
      };

      const snapshot = await buildQuery().get();
      console.log('📊 Query executed, docs found:', snapshot.docs.length);
      let products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Eski category alanını categories array'ine çevir ve her iki field'ı da garanti et
          categories: data.categories || (data.category ? [data.category] : []),
          category: data.category || (data.categories && data.categories[0] ? data.categories[0] : ''),
          tags: Array.isArray(data.tags) ? data.tags : [],
          options: Array.isArray(data.options) ? data.options : [],
        };
      }) as Product[];

      console.log('🔍 Before filtering - products count:', products.length);
      console.log('🔍 Sample product structure:', products[0] ? {
        name: products[0].name,
        categories: products[0].categories,
        category: products[0].category,
        tags: products[0].tags
      } : 'No products');

      // Kategori filtresi (client-side)
      if (category && category !== 'all') {
        if (category === 'populer') {
          // Popüler kategori için özel mantık
          products = products.filter(product => {
            const hasPopularTag = product.tags.includes('populer') || 
                                 product.tags.includes('popular') || 
                                 product.tags.includes('cok-satan');
            console.log(`🔍 Product ${product.name} - popular check: ${hasPopularTag}`, product.tags);
            return hasPopularTag;
          });
        } else {
          // Diğer kategoriler için - hem categories array hem de category string kontrol et
          products = products.filter(product => {
            const isInCategory = (product.categories && product.categories.includes(category)) ||
                               (product.category === category);
            console.log(`🔍 Product ${product.name} - category check: ${isInCategory}`, {
              requestedCategory: category,
              productCategories: product.categories,
              productCategory: product.category
            });
            return isInCategory;
          });
        }
      }

      console.log('🔍 After category filtering - products count:', products.length);

      // Arama filtresi (client-side)
      if (search) {
        const searchTerm = search.toLowerCase();
        products = products.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.categories.some(cat => cat.toLowerCase().includes(searchTerm))
        );
        console.log('🔍 After search filtering - products count:', products.length);
      }

      console.log('✅ Final products being returned:', products.length);

      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: products,
      });

    } catch (firebaseError) {
      console.error('❌ Firebase query error:', firebaseError);
      console.error('Error details:', {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      });
      
      // Firebase hatası varsa mock data döndür
      console.log('🔄 Falling back to mock data...');
      const sampleProducts: Product[] = [
        {
          id: 'sample-1',
          name: 'Klasik Cheeseburger',
          description: 'Özel soslu dana eti, cheddar peyniri, marul, domates',
          price: 45.90,
          originalPrice: 52.90,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
          categories: ['et-burger', 'populer'],
          category: 'et-burger',
          discount: 13,
          tags: ['populer', 'cok-satan'],
          hasOptions: true,
          options: [],
          stock: 50,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: sampleProducts,
      });
    }

  } catch (error) {
    console.error('❌ General API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Ürünler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}