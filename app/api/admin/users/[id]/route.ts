import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import bcrypt from 'bcryptjs';
import { User } from '../route';
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
      // Mock data for testing
      const mockUser: User = {
        id: params.id,
        uid: params.id,
        name: 'Örnek Kullanıcı',
        email: 'ornek@test.com',
        role: 'user',
        provider: 'credentials',
        isActive: true,
        isBanned: false,
        ipAddress: '192.168.1.100',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<User>>({
        success: true,
        data: mockUser,
      });
    }

    // Find user by ID (check multiple fields)
    const usersSnapshot = await adminDb.collection('users').get();
    let userDoc = null;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.uid === params.id || data.id === params.id || doc.id === params.id) {
        userDoc = { id: doc.id, ...data };
        break;
      }
    }
    
    if (!userDoc) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kullanıcı bulunamadı',
      }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userData } = userDoc;

    const user = {
      ...userData,
      // Convert timestamps
      createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData.createdAt,
      updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : userData.updatedAt,
      lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate().toISOString() : userData.lastLoginAt,
      bannedAt: userData.bannedAt?.toDate ? userData.bannedAt.toDate().toISOString() : userData.bannedAt,
    } as User;

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kullanıcı yüklenirken bir hata oluştu',
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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();

    // Find user document
    const usersSnapshot = await adminDb.collection('users').get();
    let userDocId = null;
    let currentUserData = null;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.uid === params.id || data.id === params.id || doc.id === params.id) {
        userDocId = doc.id;
        currentUserData = data;
        break;
      }
    }
    
    if (!userDocId || !currentUserData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kullanıcı bulunamadı',
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Hash password if provided
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    // Email uniqueness check if email is being changed
    if (body.email?.trim() && body.email !== currentUserData.email) {
      const existingEmailDoc = await adminDb.collection('users').doc(body.email).get();
      if (existingEmailDoc.exists && existingEmailDoc.id !== userDocId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor',
        }, { status: 400 });
      }
    }

    await adminDb.collection('users').doc(userDocId).update(updateData);

    // Get updated user data
    const updatedDoc = await adminDb.collection('users').doc(userDocId).get();
    const updatedData = updatedDoc.data();
    
    // Remove password from response
    const { password, ...userData } = updatedData || {};
    
    const updatedUser = {
      id: updatedDoc.id,
      ...userData,
      // Convert timestamps
      createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData.createdAt,
      updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : userData.updatedAt,
      lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate().toISOString() : userData.lastLoginAt,
      bannedAt: userData.bannedAt?.toDate ? userData.bannedAt.toDate().toISOString() : userData.bannedAt,
    } as User;

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: updatedUser,
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kullanıcı güncellenirken bir hata oluştu',
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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    // Prevent self-deletion
    if (params.id === (session.user as any)?.id || params.id === (session.user as any)?.uid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kendi hesabınızı silemezsiniz',
      }, { status: 400 });
    }

    // Find and delete user document
    const usersSnapshot = await adminDb.collection('users').get();
    let userDocId = null;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.uid === params.id || data.id === params.id || doc.id === params.id) {
        userDocId = doc.id;
        break;
      }
    }
    
    if (!userDocId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kullanıcı bulunamadı',
      }, { status: 404 });
    }

    await adminDb.collection('users').doc(userDocId).delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Kullanıcı başarıyla silindi',
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kullanıcı silinirken bir hata oluştu',
    }, { status: 500 });
  }
}
