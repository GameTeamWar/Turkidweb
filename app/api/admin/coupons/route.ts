import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number; // Yeni: Kullanıcı başına kullanım limiti
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    let query: any = adminDb.collection('coupons');

    if (isActive !== null && isActive !== '') {
      query = query.where('isActive', '==', isActive === 'true');
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let coupons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Coupon[];

    // Apply search filter (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      coupons = coupons.filter(coupon =>
        (coupon.name?.toLowerCase() || '').includes(searchTerm) ||
        (coupon.code?.toLowerCase() || '').includes(searchTerm) ||
        (coupon.description?.toLowerCase() || '').includes(searchTerm)
      );
    }

    return NextResponse.json<ApiResponse<Coupon[]>>({
      success: true,
      data: coupons,
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kuponlar yüklenirken bir hata oluştu',
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
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      name, 
      code, 
      type, 
      value, 
      minOrderAmount, 
      maxDiscountAmount,
      usageLimit,
      userUsageLimit, // Yeni alan
      validFrom,
      validUntil,
      isActive,
      applicableProducts,
      applicableCategories,
      description 
    } = body;

    // Validation
    if (!name?.trim() || !code?.trim() || !type || !value) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (ad, kod, tip, değer)',
      }, { status: 400 });
    }

    if (type === 'percentage' && (value <= 0 || value > 100)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yüzde indirimi 1-100 arasında olmalıdır',
      }, { status: 400 });
    }

    if (type === 'fixed' && value <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sabit indirim 0\'dan büyük olmalıdır',
      }, { status: 400 });
    }

    const couponId = `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const couponData: Coupon = {
      id: couponId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value.toString()),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount.toString()) : undefined,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount.toString()) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit.toString()) : undefined,
      userUsageLimit: userUsageLimit ? parseInt(userUsageLimit.toString()) : undefined, // Yeni alan
      usageCount: 0,
      validFrom: validFrom || new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: Boolean(isActive),
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if coupon code already exists
    const existingCoupon = await adminDb.collection('coupons').where('code', '==', couponData.code).get();
    if (!existingCoupon.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kupon kodu zaten kullanılıyor',
      }, { status: 400 });
    }

    await adminDb.collection('coupons').doc(couponId).set(couponData);

    return NextResponse.json<ApiResponse<Coupon>>({
      success: true,
      message: 'Kupon başarıyla oluşturuldu',
      data: couponData,
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kupon oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}
