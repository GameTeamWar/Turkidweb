import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import bcrypt from 'bcryptjs';
import type { Session } from 'next-auth';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  provider: 'credentials' | 'google';
  isActive: boolean;
  isBanned: boolean;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  ipAddress?: string;
  lastLoginAt?: string;
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
      // Mock data for testing
      const mockUsers: User[] = [
        {
          id: 'user1',
          uid: 'test-admin',
          name: 'Admin User',
          email: 'admin@turkid.com',
          role: 'admin',
          provider: 'credentials',
          isActive: true,
          isBanned: false,
          ipAddress: '127.0.0.1',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'user2',
          uid: 'test-user',
          name: 'Test User',
          email: 'user@test.com',
          role: 'user',
          provider: 'credentials',
          isActive: true,
          isBanned: false,
          ipAddress: '192.168.1.100',
          lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      return NextResponse.json<ApiResponse<User[]>>({
        success: true,
        data: mockUsers,
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const provider = searchParams.get('provider');
    const isActive = searchParams.get('isActive');
    const isBanned = searchParams.get('isBanned');

    let query: any = adminDb.collection('users');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }
    if (provider) {
      query = query.where('provider', '==', provider);
    }
    if (isActive !== null && isActive !== '') {
      query = query.where('isActive', '==', isActive === 'true');
    }
    if (isBanned !== null && isBanned !== '') {
      query = query.where('isBanned', '==', isBanned === 'true');
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamps
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt,
        bannedAt: data.bannedAt?.toDate ? data.bannedAt.toDate().toISOString() : data.bannedAt,
      };
    }) as User[];

    // Apply search filter (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      users = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm) ||
        (user.email?.toLowerCase() || '').includes(searchTerm) ||
        (user.uid?.toLowerCase() || '').includes(searchTerm)
      );
    }

    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kullanıcılar yüklenirken bir hata oluştu',
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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    // Validation
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ad, email ve şifre gerekli',
      }, { status: 400 });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir email adresi girin',
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await adminDb.collection('users').doc(email).get();
    
    if (existingUser.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu email adresi zaten kayıtlı',
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userData: User = {
      id: userId,
      uid: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role || 'user',
      provider: 'credentials',
      isActive: Boolean(isActive),
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firebase (without password in the response)
    await adminDb.collection('users').doc(email).set({
      ...userData,
      password: hashedPassword,
    });

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: userData,
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kullanıcı oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}
