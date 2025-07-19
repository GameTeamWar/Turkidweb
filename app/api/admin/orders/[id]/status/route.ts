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
    console.log('📝 Order status update API called for ID:', params.id);
    
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

    const { status, updatedBy } = await request.json();
    console.log('📝 Status update data:', { status, updatedBy });

    if (!status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Durum bilgisi gerekli',
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçersiz durum',
      }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(params.id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.log('❌ Order not found:', params.id);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Admin',
    };

    // Add delivery timestamp for delivered orders
    if (status === 'delivered') {
      updateData.deliveredAt = new Date().toISOString();
    }

    console.log('💾 Updating order with data:', updateData);

    await orderRef.update(updateData);

    // Create status history entry
    try {
      const statusHistoryId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await adminDb.collection('orders').doc(params.id).collection('statusHistory').doc(statusHistoryId).set({
        status,
        timestamp: new Date().toISOString(),
        note: `Durum güncellendi: ${status}`,
        updatedBy: updateData.updatedBy
      });
      console.log('✅ Status history created');
    } catch (historyError) {
      console.error('❌ Error creating status history:', historyError);
      // Don't fail the update if history creation fails
    }

    console.log('✅ Order status updated successfully');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Sipariş durumu güncellendi',
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş durumu güncellenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}