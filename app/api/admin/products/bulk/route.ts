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

    const body = await request.json();
    const { productIds, action, data } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli ürün ID\'leri gerekli',
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'İşlem türü gerekli',
      }, { status: 400 });
    }

    const batch = adminDb.batch();
    const timestamp = new Date().toISOString();

    switch (action) {
      case 'activate':
        productIds.forEach((productId: string) => {
          const productRef = adminDb.collection('products').doc(productId);
          batch.update(productRef, {
            isActive: true,
            updatedAt: timestamp,
          });
        });
        break;

      case 'deactivate':
        productIds.forEach((productId: string) => {
          const productRef = adminDb.collection('products').doc(productId);
          batch.update(productRef, {
            isActive: false,
            updatedAt: timestamp,
          });
        });
        break;

      case 'delete':
        // Önce aktif siparişlerde kullanılıp kullanılmadığını kontrol et
        const activeOrdersQuery = await adminDb
          .collection('orders')
          .where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready'])
          .get();

        const productsInActiveOrders = new Set<string>();
        activeOrdersQuery.docs.forEach(doc => {
          const orderData = doc.data();
          if (orderData.items) {
            orderData.items.forEach((item: any) => {
              if (productIds.includes(item.id)) {
                productsInActiveOrders.add(item.id);
              }
            });
          }
        });

        if (productsInActiveOrders.size > 0) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `${productsInActiveOrders.size} ürün aktif siparişlerde kullanıldığı için silinemez`,
          }, { status: 400 });
        }

        productIds.forEach((productId: string) => {
          const productRef = adminDb.collection('products').doc(productId);
          batch.delete(productRef);
        });
        break;

      case 'updateCategory':
        if (!data?.category) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Kategori bilgisi gerekli',
          }, { status: 400 });
        }
        
        productIds.forEach((productId: string) => {
          const productRef = adminDb.collection('products').doc(productId);
          batch.update(productRef, {
            category: data.category,
            updatedAt: timestamp,
          });
        });
        break;

      case 'updatePrice':
        if (!data?.priceUpdate) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Fiyat güncelleme bilgisi gerekli',
          }, { status: 400 });
        }

        // Önce mevcut ürünleri al
        const productDocs = await Promise.all(
          productIds.map((id: string) => adminDb.collection('products').doc(id).get())
        );

        productDocs.forEach((doc, index) => {
          if (doc.exists) {
            const currentData = doc.data();
            let newPrice = currentData?.price;

            if (data.priceUpdate.type === 'percentage') {
              const percentage = parseFloat(data.priceUpdate.value);
              newPrice = currentData?.price * (1 + percentage / 100);
            } else if (data.priceUpdate.type === 'fixed') {
              const amount = parseFloat(data.priceUpdate.value);
              newPrice = data.priceUpdate.operation === 'add' 
                ? currentData?.price + amount 
                : currentData?.price - amount;
            } else if (data.priceUpdate.type === 'absolute') {
              newPrice = parseFloat(data.priceUpdate.value);
            }

            // İndirim hesapla
            let discount = 0;
            if (currentData?.originalPrice && newPrice) {
              discount = Math.round(((currentData.originalPrice - newPrice) / currentData.originalPrice) * 100);
            }

            const productRef = adminDb.collection('products').doc(productIds[index]);
            batch.update(productRef, {
              price: Math.max(0, newPrice), // Negatif fiyat olmasın
              discount: Math.max(0, discount),
              updatedAt: timestamp,
            });
          }
        });
        break;

      case 'addTag':
        if (!data?.tag) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Etiket bilgisi gerekli',
          }, { status: 400 });
        }

        // Mevcut ürünleri al ve etiket ekle
        const productsForTag = await Promise.all(
          productIds.map((id: string) => adminDb.collection('products').doc(id).get())
        );

        productsForTag.forEach((doc, index) => {
          if (doc.exists) {
            const currentData = doc.data();
            const currentTags = currentData?.tags || [];
            
            if (!currentTags.includes(data.tag)) {
              const productRef = adminDb.collection('products').doc(productIds[index]);
              batch.update(productRef, {
                tags: [...currentTags, data.tag],
                updatedAt: timestamp,
              });
            }
          }
        });
        break;

      case 'removeTag':
        if (!data?.tag) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Etiket bilgisi gerekli',
          }, { status: 400 });
        }

        // Mevcut ürünleri al ve etiket çıkar
        const productsForTagRemoval = await Promise.all(
          productIds.map((id: string) => adminDb.collection('products').doc(id).get())
        );

        productsForTagRemoval.forEach((doc, index) => {
          if (doc.exists) {
            const currentData = doc.data();
            const currentTags = currentData?.tags || [];
            
            if (currentTags.includes(data.tag)) {
              const productRef = adminDb.collection('products').doc(productIds[index]);
              batch.update(productRef, {
                tags: currentTags.filter((tag: string) => tag !== data.tag),
                updatedAt: timestamp,
              });
            }
          }
        });
        break;

      case 'updateStock':
        if (data?.stock === undefined) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Stok bilgisi gerekli',
          }, { status: 400 });
        }

        productIds.forEach((productId: string) => {
          const productRef = adminDb.collection('products').doc(productId);
          batch.update(productRef, {
            stock: data.stock === null ? null : parseInt(data.stock),
            updatedAt: timestamp,
          });
        });
        break;

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Geçersiz işlem türü',
        }, { status: 400 });
    }

    // Batch işlemini gerçekleştir
    await batch.commit();

    // İşlem mesajını belirle
    let message = '';
    switch (action) {
      case 'activate':
        message = `${productIds.length} ürün aktif edildi`;
        break;
      case 'deactivate':
        message = `${productIds.length} ürün pasif edildi`;
        break;
      case 'delete':
        message = `${productIds.length} ürün silindi`;
        break;
      case 'updateCategory':
        message = `${productIds.length} ürünün kategorisi güncellendi`;
        break;
      case 'updatePrice':
        message = `${productIds.length} ürünün fiyatı güncellendi`;
        break;
      case 'addTag':
        message = `${productIds.length} ürüne etiket eklendi`;
        break;
      case 'removeTag':
        message = `${productIds.length} üründen etiket çıkarıldı`;
        break;
      case 'updateStock':
        message = `${productIds.length} ürünün stoğu güncellendi`;
        break;
      default:
        message = `${productIds.length} ürün güncellendi`;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message,
      data: {
        processedCount: productIds.length,
        action,
      },
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Toplu işlem sırasında bir hata oluştu',
    }, { status: 500 });
  }
}