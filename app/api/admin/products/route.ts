// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Product } from '@/types';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

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
        }
      ];

      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: sampleProducts,
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = adminDb.collection('products');

    // Filtreleri uygula
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    // Sıralama
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, orderDirection);

    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    }) as Product[];

    // Arama filtresi (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: products,
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
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      image,
      tags, 
      hasOptions, 
      options,
      stock,
      isActive,
      discount
    } = body;

    // Validation
    if (!name || !description || !price || !category || !image) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (ad, açıklama, fiyat, kategori, görsel)',
      }, { status: 400 });
    }

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir fiyat girin',
      }, { status: 400 });
    }

    if (originalPrice && (typeof originalPrice !== 'number' || originalPrice <= 0)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir orijinal fiyat girin',
      }, { status: 400 });
    }

    if (stock !== undefined && stock !== null && (typeof stock !== 'number' || stock < 0)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Stok negatif olamaz',
      }, { status: 400 });
    }

    // Açıklama uzunluk kontrolü
    if (description.length > 150) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Açıklama en fazla 150 karakter olabilir',
      }, { status: 400 });
    }

    // Opsiyon validasyonu
    if (hasOptions && options && Array.isArray(options)) {
      for (const option of options) {
        if (!option.name || option.choices.length === 0) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Tüm opsiyonların adı ve en az bir seçeneği olmalı',
          }, { status: 400 });
        }
        
        if (option.minSelect > option.maxSelect) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Minimum seçim, maksimum seçimden fazla olamaz',
          }, { status: 400 });
        }

        if (option.maxSelect > option.choices.length) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Maksimum seçim sayısı, seçenek sayısından fazla olamaz',
          }, { status: 400 });
        }
      }
    }

    // Ürün ID oluştur
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // İndirim hesapla
    const calculatedDiscount = originalPrice && originalPrice > price ? 
      Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const productData: Omit<Product, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price.toString()),
      originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : undefined,
      image: image.trim(),
      category: category.trim(),
      discount: calculatedDiscount,
      tags: Array.isArray(tags) ? tags : [],
      hasOptions: Boolean(hasOptions),
      options: hasOptions && Array.isArray(options) ? options : [],
      stock: stock !== undefined && stock !== null ? parseInt(stock.toString()) : undefined,
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