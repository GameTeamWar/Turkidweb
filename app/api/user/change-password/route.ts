// app/api/user/change-password/route.ts - Şifre değiştirme fonksiyonu için uygulanmış hali
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    // Get user from Firestore
    const userRef = adminDb.collection('users').doc(session.user.email);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userData?.password || '');
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await userRef.update({
      password: hashedNewPassword,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
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
