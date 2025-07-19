// app/api/admin/products/route.ts - POST methodu eklendi
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Product } from '@/types';
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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');
    const hasDiscount = searchParams.get('hasDiscount');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('🔍 Admin fetching products from Firebase...');

    try {
      let query: any = adminDb.collection('products');

      // Filtreler
      if (isActive !== null && isActive !== '') {
        query = query.where('isActive', '==', isActive === 'true');
      }

      if (hasDiscount === 'true') {
        query = query.where('discount', '>', 0);
      } else if (hasDiscount === 'false') {
        query = query.where('discount', '==', 0);
      }

      // Sıralama
      query = query.orderBy(sortBy, sortOrder);

      const snapshot = await query.get();
      console.log(`📊 Found ${snapshot.docs.length} products`);

      let products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Tarih alanlarını string'e çevir
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          // Eski category alanını categories array'ine çevir
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

      // Kategori filtresi (client-side)
      if (category) {
        if (category === 'populer') {
          products = products.filter(product => 
            product.tags.includes('populer') || 
            product.tags.includes('popular') || 
            product.tags.includes('cok-satan')
          );
        } else {
          products = products.filter(product => 
            (product.categories && product.categories.includes(category)) ||
            product.category === category
          );
        }
      }

      // Arama filtresi (client-side)
      if (search) {
        const searchTerm = search.toLowerCase();
        products = products.filter(product =>
          (product.name?.toLowerCase() || '').includes(searchTerm) ||
          (product.description?.toLowerCase() || '').includes(searchTerm) ||
          product.categories.some(cat => cat.toLowerCase().includes(searchTerm))
        );
      }

      console.log(`✅ Returning ${products.length} filtered products`);

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
    console.error('❌ Get admin products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Ürünler yüklenirken bir hata oluştu: ${error.message}`,
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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      image, 
      categories, 
      tags, 
      hasOptions, 
      options, 
      stock, 
      isActive 
    } = body;

    console.log('📝 Creating new product:', { name, categories, price });

    // Validation
    if (!name?.trim() || !description?.trim() || !price || !image?.trim()) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (ad, açıklama, fiyat, görsel)',
      }, { status: 400 });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'En az bir kategori seçmelisiniz',
      }, { status: 400 });
    }

    if (price <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Fiyat 0\'dan büyük olmalıdır',
      }, { status: 400 });
    }

    if (originalPrice && originalPrice <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Orijinal fiyat 0\'dan büyük olmalıdır',
      }, { status: 400 });
    }

    if (stock !== undefined && stock !== null && stock < 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Stok miktarı 0\'dan küçük olamaz',
      }, { status: 400 });
    }

    // Check if product name already exists
    const existingProductQuery = await adminDb
      .collection('products')
      .where('name', '==', name.trim())
      .get();

    if (!existingProductQuery.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu isimde bir ürün zaten mevcut',
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (originalPrice && price && originalPrice > price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    // Generate product ID
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const productData: Product = {
      id: productId,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price.toString()),
      originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : undefined,
      image: image.trim(),
      categories: Array.isArray(categories) ? categories : [],
      category: categories[0], // Geriye uyumluluk için
      discount,
      tags: Array.isArray(tags) ? tags : [],
      hasOptions: Boolean(hasOptions),
      options: Array.isArray(options) ? options : [],
      stock: stock !== undefined ? parseInt(stock.toString()) : undefined,
      isActive: Boolean(isActive),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Saving product to Firebase:', productId);

    await adminDb.collection('products').doc(productId).set(productData);

    console.log('✅ Product created successfully');

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: productData,
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Ürün oluşturulurken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}