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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection not available',
      }, { status: 503 });
    }

    console.log('🔥 Attempting Firebase query...');
    
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
    }) as (Product & { category: string })[];

    console.log('🔍 Before filtering - products count:', products.length);

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