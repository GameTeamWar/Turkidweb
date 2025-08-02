// app/api/orders/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚫 Order cancel API called for ID:', params.id);
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil. Firebase yapılandırmasını kontrol edin.',
      }, { status: 503 });
    }

    const orderId = params.id;
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sipariş bulunamadı',
      }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Check if user owns the order (unless admin)
    if ((session.user as any)?.role !== 'admin' && orderData?.userEmail !== session.user?.email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu siparişi iptal etme yetkiniz yok',
      }, { status: 403 });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(orderData?.status)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu sipariş artık iptal edilemez',
      }, { status: 400 });
    }

    console.log('💾 Cancelling order:', orderId);

    // Update order status to cancelled
    const updateData = {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      cancelledAt: new Date().toISOString(),
      cancelledBy: session.user?.email || 'User',
      cancelReason: 'Müşteri tarafından iptal edildi'
    };

    await orderRef.update(updateData);

    // Create status history entry
    try {
      const statusHistoryId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await adminDb.collection('orders').doc(orderId).collection('statusHistory').doc(statusHistoryId).set({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        note: 'Müşteri tarafından iptal edildi',
        updatedBy: session.user?.name || 'Müşteri'
      });
      console.log('✅ Cancel history created');
    } catch (historyError) {
      console.error('❌ Error creating cancel history:', historyError);
      // Don't fail the cancellation if history creation fails
    }

    // If coupon was used, restore usage count
    if (orderData?.appliedCoupon?.id) {
      try {
        const couponRef = adminDb.collection('coupons').doc(orderData.appliedCoupon.id);
        const couponDoc = await couponRef.get();
        
        if (couponDoc.exists) {
          const couponData = couponDoc.data();
          await couponRef.update({
            usageCount: Math.max(0, (couponData?.usageCount || 1) - 1),
            updatedAt: new Date().toISOString()
          });

          // Remove user-specific usage record
          const usageQuery = await adminDb.collection('couponUsage')
            .where('orderId', '==', orderId)
            .where('userEmail', '==', session.user?.email)
            .get();

          if (!usageQuery.empty) {
            const batch = adminDb.batch();
            usageQuery.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
          }
        }
        
        console.log('✅ Coupon usage restored');
      } catch (couponError) {
        console.error('❌ Error restoring coupon usage:', couponError);
        // Don't fail the cancellation if coupon restoration fails
      }
    }

    console.log('✅ Order cancelled successfully');

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Sipariş başarıyla iptal edildi',
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş iptal edilirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}