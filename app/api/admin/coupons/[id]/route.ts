import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { Coupon } from '@/app/api/admin/coupons/route';
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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const couponDoc = await adminDb.collection('coupons').doc(params.id).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kupon bulunamadı',
      }, { status: 404 });
    }

    const couponData = couponDoc.data();
    const coupon = {
      id: couponDoc.id,
      ...couponData,
    } as Coupon;

    return NextResponse.json<ApiResponse<Coupon>>({
      success: true,
      data: coupon,
    });

  } catch (error) {
    console.error('Get coupon error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kupon yüklenirken bir hata oluştu',
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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();
    
    // Mevcut kuponu kontrol et
    const couponDoc = await adminDb.collection('coupons').doc(params.id).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kupon bulunamadı',
      }, { status: 404 });
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Validation
    if (body.value !== undefined) {
      if (body.type === 'percentage' && (body.value <= 0 || body.value > 100)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Yüzde indirimi 1-100 arasında olmalıdır',
        }, { status: 400 });
      }

      if (body.type === 'fixed' && body.value <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Sabit indirim 0\'dan büyük olmalıdır',
        }, { status: 400 });
      }
    }

    await adminDb.collection('coupons').doc(params.id).update(updateData);

    // Güncellenmiş kuponu getir
    const updatedDoc = await adminDb.collection('coupons').doc(params.id).get();
    const updatedData = updatedDoc.data();
    const updatedCoupon = {
      id: updatedDoc.id,
      ...updatedData,
    } as Coupon;

    return NextResponse.json<ApiResponse<Coupon>>({
      success: true,
      message: 'Kupon başarıyla güncellendi',
      data: updatedCoupon,
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kupon güncellenirken bir hata oluştu',
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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    // Kuponun var olup olmadığını kontrol et
    const couponDoc = await adminDb.collection('coupons').doc(params.id).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kupon bulunamadı',
      }, { status: 404 });
    }

    // Kuponu sil
    await adminDb.collection('coupons').doc(params.id).delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Kupon başarıyla silindi',
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kupon silinirken bir hata oluştu',
    }, { status: 500 });
  }
}
