// app/api/orders/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Order, CartItem } from '@/types';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = adminDb.collection('orders').orderBy('createdAt', 'desc');

    // Admin tüm siparişleri görebilir, user sadece kendi siparişlerini
    if ((session.user as any)?.role !== 'admin') {
      query = query.where('userEmail', '==', session.user?.email);
    } else if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Tarih alanlarını string'e çevir
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate ? 
          data.estimatedDeliveryTime.toDate().toISOString() : data.estimatedDeliveryTime,
      };
    }) as Order[];

    return NextResponse.json<ApiResponse<Order[]>>({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Siparişler yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📦 Creating new order...');
    
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Giriş gerekli',
      }, { status: 401 });
    }

    console.log('👤 User session:', {
      email: session.user?.email,
      name: session.user?.name,
      role: (session.user as any)?.role
    });

    const body = await request.json();
    console.log('📝 Order request body:', body);

    const { 
      items, 
      paymentMethod, 
      orderNote, 
      deliveryAddress, 
      phone, 
      appliedCoupon,
      discountAmount 
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Sepet boş',
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ödeme yöntemi seçiniz',
      }, { status: 400 });
    }

    console.log('💰 Calculating order totals...');

    // Calculate totals
    const subtotal = items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // %8 KDV
    let total = subtotal + tax;

    // Apply discount if coupon is used
    if (appliedCoupon && discountAmount) {
      total = Math.max(0, total - discountAmount);
    }

    console.log('💰 Order totals:', { subtotal, tax, discountAmount, total });

    // Generate order ID and number
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    console.log('🔢 Generated order ID:', orderId, 'Order Number:', orderNumber);

    const orderData: Omit<Order, 'id'> = {
      orderNumber,
      userId: (session.user as any)?.uid || session.user?.email || '',
      userEmail: session.user?.email || '',
      userName: session.user?.name || '',
      items,
      subtotal,
      tax,
      total,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      orderNote: orderNote || '',
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 dakika
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appliedCoupon: appliedCoupon || undefined,
      discountAmount: discountAmount || 0
    };

    console.log('📋 Order data prepared:', {
      orderId,
      orderNumber: orderData.orderNumber,
      userEmail: orderData.userEmail,
      itemsCount: orderData.items.length,
      total: orderData.total
    });

    // Handle case when Firebase Admin is not available
    if (!adminDb) {
      console.log('⚠️ Firebase Admin not available - using mock order creation');
      
      return NextResponse.json<ApiResponse<Order>>({
        success: true,
        message: 'Sipariş başarıyla oluşturuldu (Test Mode)',
        data: { id: orderId, ...orderData },
      });
    }

    console.log('🔥 Saving order to Firebase...');

    try {
      // Save order to Firebase
      await adminDb.collection('orders').doc(orderId).set(orderData);
      console.log('✅ Order saved to Firebase');

      // Handle coupon usage if applicable
      if (appliedCoupon && appliedCoupon.id) {
        console.log('🎫 Processing coupon usage...');
        
        try {
          // Increment coupon usage count
          await adminDb.collection('coupons').doc(appliedCoupon.id).update({
            usageCount: (appliedCoupon.usageCount || 0) + 1,
            updatedAt: new Date().toISOString()
          });

          // Record user-specific usage
          const couponUsageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await adminDb.collection('couponUsage').doc(couponUsageId).set({
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            userEmail: session.user?.email,
            orderId: orderId,
            usedAt: new Date().toISOString(),
            orderTotal: total,
            discountAmount: discountAmount || 0
          });

          console.log('✅ Coupon usage recorded');
        } catch (couponError) {
          console.error('❌ Error recording coupon usage:', couponError);
          // Don't fail the order if coupon tracking fails
        }
      }

      // Create order status history
      console.log('📚 Creating order status history...');
      
      try {
        const statusHistoryId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await adminDb.collection('orders').doc(orderId).collection('statusHistory').doc(statusHistoryId).set({
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Sipariş alındı',
          updatedBy: 'System'
        });
        console.log('✅ Status history created');
      } catch (historyError) {
        console.error('❌ Error creating status history:', historyError);
        // Don't fail the order if history creation fails
      }

      console.log('🎉 Order creation completed successfully');

      return NextResponse.json<ApiResponse<Order>>({
        success: true,
        message: 'Sipariş başarıyla oluşturuldu',
        data: { id: orderId, ...orderData },
      });

    } catch (firebaseError) {
      console.error('❌ Firebase operation failed:', firebaseError);
      console.error('Firebase error details:', {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      });

      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Sipariş kaydedilirken bir hata oluştu: ${firebaseError.message}`,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Sipariş oluşturulurken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}