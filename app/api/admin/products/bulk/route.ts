
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