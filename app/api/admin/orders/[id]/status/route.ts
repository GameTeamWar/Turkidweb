// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

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
    const { status, updatedBy, location, estimatedDeliveryTime } = body;

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Sipariş durumu güncellendi (Mock Mode)',
      });
    }

    const orderId = params.id;

    // Siparişin var olup olmadığını kontrol et
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    // Sipariş durumunu güncelle
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || session.user?.name || 'Admin'
    };

    // Eğer location bilgisi varsa (kurye için)
    if (location) {
      updateData.courierLocation = location;
    }

    // Eğer tahmini teslimat zamanı varsa
    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    await adminDb.collection('orders').doc(orderId).update(updateData);

    // Durum geçmişine ekle
    await adminDb.collection('orders').doc(orderId)
      .collection('statusHistory').add({
        status,
        timestamp: new Date().toISOString(),
        updatedBy: updatedBy || session.user?.name || 'Admin',
        note: `Sipariş durumu ${status} olarak güncellendi`,
        location: location || null
      });

    // Güncellenmiş siparişi getir
    const updatedDoc = await adminDb.collection('orders').doc(orderId).get();
    const updatedOrder = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi',
      data: updatedOrder,
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Sipariş durumu güncellenirken bir hata oluştu',
    }, { status: 500 });
  }
}