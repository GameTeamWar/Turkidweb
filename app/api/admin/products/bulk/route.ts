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

    console.log('🔍 Bulk operation:', { productIds, action, data });

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

      case 'addDiscount':
        if (!data?.percentage || data.percentage <= 0 || data.percentage >= 100) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Geçerli bir indirim yüzdesi gerekli (1-99)',
          }, { status: 400 });
        }

        // Önce mevcut ürünleri al
        const productDocs = await Promise.all(
          productIds.map((id: string) => adminDb.collection('products').doc(id).get())
        );

        productDocs.forEach((doc, index) => {
          if (doc.exists) {
            const currentData = doc.data();
            const currentPrice = currentData?.price || 0;
            const discountPercentage = data.percentage;
            const originalPrice = currentData?.originalPrice || currentPrice;
            const newPrice = originalPrice * (1 - discountPercentage / 100);

            const productRef = adminDb.collection('products').doc(productIds[index]);
            batch.update(productRef, {
              price: Math.round(newPrice * 100) / 100, // 2 decimal places
              originalPrice: originalPrice,
              discount: discountPercentage,
              updatedAt: timestamp,
            });
          }
        });
        break;

      case 'removeDiscount':
        // Önce mevcut ürünleri al
        const productDocsForDiscount = await Promise.all(
          productIds.map((id: string) => adminDb.collection('products').doc(id).get())
        );

        productDocsForDiscount.forEach((doc, index) => {
          if (doc.exists) {
            const currentData = doc.data();
            const originalPrice = currentData?.originalPrice;

            if (originalPrice) {
              const productRef = adminDb.collection('products').doc(productIds[index]);
              batch.update(productRef, {
                price: originalPrice,
                originalPrice: null,
                discount: 0,
                updatedAt: timestamp,
              });
            }
          }
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

    console.log('✅ Bulk operation completed successfully');

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
      case 'addDiscount':
        message = `${productIds.length} ürüne %${data.percentage} indirim uygulandı`;
        break;
      case 'removeDiscount':
        message = `${productIds.length} üründen indirim kaldırıldı`;
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
    console.error('❌ Bulk operation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Toplu işlem sırasında bir hata oluştu',
    }, { status: 500 });
  }
}