// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { ApiResponse, RegisterForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterForm = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tüm alanlar zorunludur',
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Şifreler eşleşmiyor',
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır',
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
    
    const userData = {
      uid: userId,
      name,
      email,
      password: hashedPassword,
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
      provider: 'credentials',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(email).set(userData);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Hesap başarıyla oluşturuldu',
      data: {
        uid: userId,
        name,
        email,
        role: userData.role,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Hesap oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}