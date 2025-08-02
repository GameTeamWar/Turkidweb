// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Product } from '@/types';
import type { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const productDoc = await adminDb.collection('products').doc(params.id).get();
    
    if (!productDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ürün bulunamadı',
      }, { status: 404 });
    }

    const productData = productDoc.data();
    
    // Global opsiyonları populate et
    let optionsData = [];
    if (productData?.selectedOptions && Array.isArray(productData.selectedOptions)) {
      console.log(`🔄 Populating options for product: ${productData.name}`);
      
      const optionDocs = await Promise.all(
        productData.selectedOptions.map((optionId: string) => 
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
        
      console.log(`✅ Populated ${optionsData.length} options`);
      
      // Debug: Log the actual option limits
      optionsData.forEach(opt => {
        console.log(`🔧 Single Product Option: ${opt.name} - Min: ${opt.minSelect}, Max: ${opt.maxSelect}, Type: ${opt.type}`);
      });
    }
    
    const product = {
      id: productDoc.id,
      ...productData,
      optionsData: optionsData,
      categories: productData?.categories || (productData?.category ? [productData.category] : []),
      tags: Array.isArray(productData?.tags) ? productData.tags : [],
    } as Product;

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product,
    });

  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Mevcut ürünü kontrol et
    const productDoc = await adminDb.collection('products').doc(params.id).get();
    
    if (!productDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ürün bulunamadı',
      }, { status: 404 });
    }

    const currentData = productDoc.data();

    // Global opsiyonları güncelle
    let optionsData = [];
    if (body.selectedOptions && Array.isArray(body.selectedOptions)) {
      const optionDocs = await Promise.all(
        body.selectedOptions.map((optionId: string) => 
          adminDb.collection('productOptions').doc(optionId).get()
        )
      );
      
      optionsData = optionDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
      selectedOptions: body.selectedOptions || [],
      optionsData: optionsData,
      hasOptions: (body.selectedOptions || []).length > 0,
    };

    // Eğer ad değiştiriliyorsa, aynı isimde başka ürün var mı kontrol et
    if (body.name && body.name !== currentData?.name) {
      const existingProductQuery = await adminDb
        .collection('products')
        .where('name', '==', body.name.trim())
        .get();

      if (!existingProductQuery.empty) {
        // Mevcut ürün dışında aynı isimde ürün var mı?
        const conflictingProduct = existingProductQuery.docs.find(doc => doc.id !== params.id);
        if (conflictingProduct) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Bu isimde başka bir ürün zaten mevcut',
          }, { status: 400 });
        }
      }

      updateData.name = body.name.trim();
    }

    // Kategoriler validasyonu
    if (body.categories && Array.isArray(body.categories)) {
      if (body.categories.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'En az bir kategori seçmelisiniz',
        }, { status: 400 });
      }
      updateData.categories = body.categories;
      updateData.category = body.categories[0]; // Geriye uyumluluk için
    }

    // Fiyat validasyonu ve indirim hesaplama
    if (body.price || body.originalPrice !== undefined) {
      const newPrice = body.price ? parseFloat(body.price.toString()) : currentData?.price;
      const newOriginalPrice = body.originalPrice !== undefined ? 
        (body.originalPrice ? parseFloat(body.originalPrice.toString()) : undefined) : 
        currentData?.originalPrice;

      if (newPrice <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Fiyat 0\'dan büyük olmalıdır',
        }, { status: 400 });
      }

      if (newOriginalPrice && newOriginalPrice <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Orijinal fiyat 0\'dan büyük olmalıdır',
        }, { status: 400 });
      }

      updateData.price = newPrice;
      updateData.originalPrice = newOriginalPrice;

      // İndirim hesapla
      if (newOriginalPrice && newPrice && newOriginalPrice > newPrice) {
        updateData.discount = Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100);
      } else {
        updateData.discount = 0;
      }
    }

    // Stok validasyonu
    if (body.stock !== undefined) {
      if (body.stock !== null && body.stock < 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Stok miktarı 0\'dan küçük olamaz',
        }, { status: 400 });
      }
      updateData.stock = body.stock ? parseInt(body.stock.toString()) : undefined;
    }

    // Tags array olduğunu garanti et
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    }

    await adminDb.collection('products').doc(params.id).update(updateData);

    // Güncellenmiş ürünü getir
    const updatedDoc = await adminDb.collection('products').doc(params.id).get();
    const updatedData = updatedDoc.data();
    
    // Güncellenmiş opsiyonları populate et
    let updatedOptionsData = [];
    if (updatedData?.selectedOptions && Array.isArray(updatedData.selectedOptions)) {
      console.log(`🔄 Re-populating options after update`);
      
      const optionDocs = await Promise.all(
        updatedData.selectedOptions.map((optionId: string) => 
          adminDb.collection('productOptions').doc(optionId).get()
        )
      );
      
      updatedOptionsData = optionDocs
        .filter(doc => doc.exists)
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          choices: doc.data()?.choices || []
        }));
        
      console.log(`✅ Re-populated ${updatedOptionsData.length} options`);
    }
    
    const updatedProduct = {
      id: updatedDoc.id,
      ...updatedData,
      optionsData: updatedOptionsData,
      categories: updatedData?.categories || (updatedData?.category ? [updatedData.category] : []),
      tags: Array.isArray(updatedData?.tags) ? updatedData.tags : [],
    } as Product;

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: updatedProduct,
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün güncellenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Mevcut ürünü kontrol et
    const productDoc = await adminDb.collection('products').doc(params.id).get();
    
    if (!productDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ürün bulunamadı',
      }, { status: 404 });
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Fiyat güncellemesi varsa indirim hesapla
    if (body.price || body.originalPrice) {
      const currentData = productDoc.data();
      const newPrice = body.price !== undefined ? parseFloat(body.price) : currentData?.price;
      const newOriginalPrice = body.originalPrice !== undefined ? 
        (body.originalPrice ? parseFloat(body.originalPrice) : undefined) : 
        currentData?.originalPrice;

      if (newOriginalPrice && newPrice && newOriginalPrice > newPrice) {
        updateData.discount = Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100);
      } else {
        updateData.discount = 0;
      }

      updateData.price = newPrice;
      if (newOriginalPrice) {
        updateData.originalPrice = newOriginalPrice;
      }
    }

    await adminDb.collection('products').doc(params.id).update(updateData);

    // Güncellenmiş ürünü getir
    const updatedDoc = await adminDb.collection('products').doc(params.id).get();
    const updatedData = updatedDoc.data();
    const updatedProduct = {
      id: updatedDoc.id,
      ...updatedData,
      categories: updatedData?.categories || (updatedData?.category ? [updatedData.category] : []),
      tags: Array.isArray(updatedData?.tags) ? updatedData.tags : [],
      options: Array.isArray(updatedData?.options) ? updatedData.options : [],
    } as Product;

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: updatedProduct,
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün güncellenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    // Ürünün var olup olmadığını kontrol et
    const productDoc = await adminDb.collection('products').doc(params.id).get();
    
    if (!productDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ürün bulunamadı',
      }, { status: 404 });
    }

    // Ürünün aktif siparişlerde kullanılıp kullanılmadığını kontrol et
    try {
      const activeOrdersQuery = await adminDb
        .collection('orders')
        .where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready'])
        .get();

      let hasActiveOrders = false;
      activeOrdersQuery.docs.forEach(doc => {
        const orderData = doc.data();
        if (orderData.items && orderData.items.some((item: any) => item.id === params.id)) {
          hasActiveOrders = true;
        }
      });

      if (hasActiveOrders) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Bu ürün aktif siparişlerde kullanıldığı için silinemez. Ürünü pasif duruma getirebilirsiniz.',
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Active orders check error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Aktif siparişler kontrol edilirken bir hata oluştu',
      }, { status: 500 });
    }

    // Ürünü sil
    await adminDb.collection('products').doc(params.id).delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Ürün başarıyla silindi',
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün silinirken bir hata oluştu',
    }, { status: 500 });
  }
}