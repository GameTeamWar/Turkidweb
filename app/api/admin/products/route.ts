// app/api/products/route.ts - Sadece gerçek data
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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    console.log('🔥 Fetching products from Firebase...');
    
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
          // Tarih alanlarını string'e çevir
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          // Eski category alanını categories array'ine çevir ve her iki field'ı da garanti et
          categories: data.categories || (data.category ? [data.category] : []),
          category: data.category || (data.categories && data.categories[0] ? data.categories[0] : ''),
          tags: Array.isArray(data.tags) ? data.tags : [],
          options: Array.isArray(data.options) ? data.options : [],
          // Sayısal alanları garanti et
          price: typeof data.price === 'number' ? data.price : 0,
          originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
          discount: typeof data.discount === 'number' ? data.discount : 0,
          stock: typeof data.stock === 'number' ? data.stock : undefined,
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
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Firebase'den ürünler yüklenirken hata: ${firebaseError.message}`,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ General API error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Ürünler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}