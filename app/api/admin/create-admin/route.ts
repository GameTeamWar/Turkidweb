// app/api/admin/create-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Güvenlik kontrolü - sadece development'ta çalışsın
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu endpoint sadece development ortamında kullanılabilir',
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, secretKey } = body;

    // Gizli anahtar kontrolü
    if (secretKey !== process.env.ADMIN_CREATE_SECRET) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçersiz gizli anahtar',
      }, { status: 401 });
    }

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email, şifre ve isim gerekli',
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    // Kullanıcının zaten var olup olmadığını kontrol et
    const existingUser = await adminDb.collection('users').doc(email).get();
    
    if (existingUser.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu email adresi zaten kayıtlı',
      }, { status: 400 });
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 12);

    // Admin kullanıcısını oluştur
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userData = {
      uid: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      provider: 'credentials',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(email).set(userData);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Admin kullanıcı başarıyla oluşturuldu',
      data: {
        uid: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Admin kullanıcı oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}