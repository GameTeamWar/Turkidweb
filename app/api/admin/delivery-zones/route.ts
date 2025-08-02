// app/api/admin/delivery-zones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { DeliveryZone } from '@/types/admin';
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
        error: 'Database connection not available',
      }, { status: 503 });
    }

    const snapshot = await adminDb.collection('deliveryZones').orderBy('name', 'asc').get();
    const zones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DeliveryZone[];

    return NextResponse.json<ApiResponse<DeliveryZone[]>>({
      success: true,
      data: zones,
    });

  } catch (error) {
    console.error('Get delivery zones error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Teslimat bölgeleri yüklenirken bir hata oluştu',
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
    const { name, coordinates, minOrderAmount, averageDeliveryTime, deliveryFee, isActive } = body;

    // Validation
    if (!name || !coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik veya koordinatlar geçersiz',
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const zoneData: DeliveryZone = {
      id: zoneId,
      name: name.trim(),
      coordinates,
      isActive: Boolean(isActive),
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      averageDeliveryTime: parseInt(averageDeliveryTime) || 30,
      deliveryFee: parseFloat(deliveryFee) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('deliveryZones').doc(zoneId).set(zoneData);

    return NextResponse.json<ApiResponse<DeliveryZone>>({
      success: true,
      message: 'Teslimat bölgesi başarıyla oluşturuldu',
      data: zoneData,
    });

  } catch (error) {
    console.error('Create delivery zone error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Teslimat bölgesi oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}