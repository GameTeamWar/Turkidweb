import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    const { code, orderTotal } = await request.json();

    if (!code || !orderTotal) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kupon kodu ve sipariş tutarı gerekli',
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kupon sistemi şu anda kullanılamıyor',
      }, { status: 503 });
    }

    // Firebase validation
    const couponsQuery = await adminDb.collection('coupons').where('code', '==', code.toUpperCase()).get();
    
    if (couponsQuery.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçersiz kupon kodu',
      }, { status: 400 });
    }

    const couponDoc = couponsQuery.docs[0];
    const coupon = couponDoc.data();

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kupon aktif değil',
      }, { status: 400 });
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kuponun geçerlilik süresi dolmuş',
      }, { status: 400 });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Bu kupon minimum ${coupon.minOrderAmount}₺ sipariş için geçerlidir`,
      }, { status: 400 });
    }

    // Check total usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kuponun kullanım limiti dolmuş',
      }, { status: 400 });
    }

    // Check user-specific usage limit
    if (coupon.userUsageLimit) {
      const userEmail = session.user?.email;
      if (userEmail) {
        // Check how many times this user has used this coupon
        const userUsageQuery = await adminDb
          .collection('couponUsage')
          .where('couponId', '==', couponDoc.id)
          .where('userEmail', '==', userEmail)
          .get();

        if (userUsageQuery.size >= coupon.userUsageLimit) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Bu kuponu maksimum ${coupon.userUsageLimit} kez kullanabilirsiniz`,
          }, { status: 400 });
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: couponDoc.id,
        ...coupon,
      },
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kupon doğrulanırken bir hata oluştu',
    }, { status: 500 });
  }
}
