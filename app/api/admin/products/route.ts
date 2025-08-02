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
          // Options data
          selectedOptions: data.selectedOptions || [],
          optionsData: data.optionsData || []
        };
      }) as Product[];

      // Global opsiyonları populate et - Firebase'den gerçek veriler
      for (let product of products) {
        if (product.selectedOptions && product.selectedOptions.length > 0) {
          try {
            console.log(`🔄 Populating options for product: ${product.name}`);
            
            const optionDocs = await Promise.all(
              product.selectedOptions.map((optionId: string) => 
                adminDb.collection('productOptions').doc(optionId).get()
              )
            );
            
            product.optionsData = optionDocs
              .filter(doc => doc.exists)
              .map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                choices: doc.data()?.choices || []
              }));
              
            console.log(`✅ Populated ${product.optionsData.length} options for ${product.name}`);
            
            // Debug: Log the actual option limits
            product.optionsData.forEach(opt => {
              console.log(`🔧 Admin Option: ${opt.name} - Min: ${opt.minSelect}, Max: ${opt.maxSelect}, Type: ${opt.type}`);
            });
          } catch (error) {
            console.error('Error populating options for product:', product.id, error);
            product.optionsData = [];
          }
        }
      }

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
            (product as any).category === category
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.price || !body.categories || body.categories.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik',
      }, { status: 400 });
    }

    // Global opsiyonları al ve doğrula
    let optionsData = [];
    if (body.selectedOptions && Array.isArray(body.selectedOptions) && body.selectedOptions.length > 0) {
      console.log('🔄 Fetching selected options from Firebase:', body.selectedOptions);
      
      const optionDocs = await Promise.all(
        body.selectedOptions.map((optionId: string) => 
          adminDb.collection('productOptions').doc(optionId).get()
        )
      );
      
      optionsData = optionDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          choices: doc.data()?.choices || []
        }));
        
      console.log(`✅ Fetched ${optionsData.length} options for product`);
    }

    const productData = {
      name: body.name.trim(),
      description: body.description.trim(),
      price: parseFloat(body.price.toString()),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice.toString()) : undefined,
      image: body.image,
      categories: body.categories || [],
      category: body.categories?.[0] || '', // Geriye uyumluluk
      tags: body.tags || [],
      selectedOptions: body.selectedOptions || [], // Global opsiyon ID'leri
      optionsData: optionsData, // Populate edilmiş opsiyon verileri
      hasOptions: (body.selectedOptions || []).length > 0,
      stock: body.stock ? parseInt(body.stock.toString()) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
      discount: body.discount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('products').add(productData);
    
    const newProduct = {
      id: docRef.id,
      ...productData,
    } as Product;

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla eklendi',
      data: newProduct,
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Ürün oluşturulurken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}