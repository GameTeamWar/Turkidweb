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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const productDoc = await adminDb.collection('products').doc(params.id).get();
    
    if (!productDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ürün bulunamadı',
      }, { status: 404 });
    }

    const productData = productDoc.data();
    const product = {
      id: productDoc.id,
      ...productData,
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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
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

    // Güncelleme verilerini hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
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
    const updatedProduct = {
      id: updatedDoc.id,
      ...updatedData,
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

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
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

// app/api/admin/products/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const { productIds, action, data } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli ürün ID\'leri gerekli',
      }, { status: 400 });
    }

    const batch = adminDb.batch();
    let updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    switch (action) {
      case 'activate':
        updateData.isActive = true;
        break;
      case 'deactivate':
        updateData.isActive = false;
        break;
      case 'addDiscount':
        if (data?.percentage && data.percentage > 0 && data.percentage < 100) {
          updateData.discount = data.percentage;
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Geçerli indirim yüzdesi gerekli (1-99)',
          }, { status: 400 });
        }
        break;
      case 'removeDiscount':
        updateData.discount = 0;
        updateData.originalPrice = null;
        break;
      case 'delete':
        // For delete, we'll handle it separately
        break;
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Geçersiz işlem',
        }, { status: 400 });
    }

    for (const productId of productIds) {
      const productRef = adminDb.collection('products').doc(productId);
      
      if (action === 'delete') {
        batch.delete(productRef);
      } else {
        batch.update(productRef, updateData);
      }
    }

    await batch.commit();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${productIds.length} ürün başarıyla güncellendi`,
      data: { count: productIds.length }
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Toplu işlem sırasında bir hata oluştu',
    }, { status: 500 });
  }
}