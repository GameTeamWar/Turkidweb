// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Product, ProductFilters } from '@/types';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Filtre parametrelerini al
    const filters: ProductFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      hasStock: searchParams.get('hasStock') ? searchParams.get('hasStock') === 'true' : undefined,
      hasDiscount: searchParams.get('hasDiscount') ? searchParams.get('hasDiscount') === 'true' : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (!adminDb) {
      // Firebase Admin yoksa örnek data döndür
      const sampleProducts: Product[] = [
        {
          id: 'sample-1',
          name: 'Klasik Cheeseburger',
          description: 'Özel soslu dana eti, cheddar peyniri, marul, domates',
          price: 45.90,
          originalPrice: 52.90,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
          category: 'et-burger',
          discount: 13,
          tags: ['popular'],
          hasOptions: true,
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
          category: 'tavuk-burger',
          discount: 0,
          tags: ['new'],
          hasOptions: true,
          stock: 30,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: sampleProducts,
        pagination: {
          page,
          limit,
          total: sampleProducts.length,
          pages: Math.ceil(sampleProducts.length / limit),
        },
      });
    }

    let query = adminDb.collection('products');

    // Filtreleri uygula
    if (filters.category && filters.category !== 'all') {
      query = query.where('category', '==', filters.category);
    }

    if (filters.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }

    // Sıralama
    const orderDirection = filters.sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(filters.sortBy || 'createdAt', orderDirection);

    // Sonuçları al
    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [], // tags array'ini garanti et
        options: Array.isArray(data.options) ? data.options : [], // options array'ini garanti et
      };
    }) as Product[];

    // Arama filtresi (Firestore'da text search sınırlı olduğu için client-side)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Stok filtresi
    if (filters.hasStock !== undefined) {
      products = products.filter(product => {
        if (filters.hasStock) {
          return product.stock === undefined || product.stock > 0;
        } else {
          return product.stock !== undefined && product.stock === 0;
        }
      });
    }

    // İndirim filtresi
    if (filters.hasDiscount !== undefined) {
      products = products.filter(product => {
        if (filters.hasDiscount) {
          return product.discount > 0;
        } else {
          return product.discount === 0;
        }
      });
    }

    // Pagination
    const total = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürünler yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      tags, 
      hasOptions, 
      options,
      stock,
      isActive, 
      image 
    } = body;

    // Validation
    if (!name || !description || !price || !category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik',
      }, { status: 400 });
    }

    if (typeof price !== 'number' && isNaN(parseFloat(price))) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir fiyat girin',
      }, { status: 400 });
    }

    if (originalPrice && typeof originalPrice !== 'number' && isNaN(parseFloat(originalPrice))) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir orijinal fiyat girin',
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const parsedPrice = parseFloat(price);
    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    
    // İndirim hesapla
    const discount = parsedOriginalPrice ? 
      Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100) : 0;

    const productData: Omit<Product, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      image: image || `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop`,
      category,
      discount,
      tags: Array.isArray(tags) ? tags : [], // Array olduğunu garanti et
      hasOptions: Boolean(hasOptions),
      options: hasOptions && Array.isArray(options) ? options : [], // Array olduğunu garanti et
      stock: stock ? parseInt(stock) : undefined,
      isActive: Boolean(isActive),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('products').doc(productId).set(productData);

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: { id: productId, ...productData },
    });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}