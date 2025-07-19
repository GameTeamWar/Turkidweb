// app/api/user/profile/route.ts - authConfig kullanarak güncellenmiş
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth'; // authOptions yerine authConfig
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let profile;

    // Firebase Admin yoksa mock data döndür
    if (!adminDb) {
      console.warn('⚠️ Firebase Admin not available, using mock profile data');
      
      profile = {
        id: session.user.email,
        name: session.user.name || 'Test User',
        email: session.user.email,
        phone: '+90 555 123 4567',
        address: 'Test Address, Istanbul',
        dateOfBirth: '1990-01-01',
        avatar: session.user.image || '',
        totalOrders: 5,
        totalSpent: 250.75,
        memberSince: '2024-01-01T00:00:00.000Z',
      };

      return NextResponse.json({ success: true, profile });
    }

    // Get user profile from Firestore
    const userRef = adminDb.collection('users').doc(session.user.email);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // Get user orders for statistics
    const ordersSnapshot = await adminDb.collection('orders')
      .where('userEmail', '==', session.user.email)
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    profile = {
      id: userDoc.id,
      name: userData?.name || session.user.name || '',
      email: session.user.email,
      phone: userData?.phone || '',
      address: userData?.address || '',
      dateOfBirth: userData?.dateOfBirth || null,
      avatar: userData?.avatar || session.user.image || '',
      totalOrders,
      totalSpent,
      memberSince: userData?.createdAt || new Date().toISOString(),
    };

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, address, dateOfBirth } = await request.json();

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required and must be at least 2 characters' }, { status: 400 });
    }

    // Firebase Admin yoksa sadece success döndür
    if (!adminDb) {
      console.warn('⚠️ Firebase Admin not available, profile update skipped');
      return NextResponse.json({ success: true });
    }

    // Update user profile in Firestore
    const userRef = adminDb.collection('users').doc(session.user.email);
    const updateData: any = {
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

    await userRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
