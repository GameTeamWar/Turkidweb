// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { ApiResponse, RegisterForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Register API called');
    
    const body: RegisterForm = await request.json();
    const { name, email, password, confirmPassword } = body;

    console.log('📝 Registration attempt for:', email);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      console.log('❌ Validation failed: Missing fields');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tüm alanlar zorunludur',
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Password mismatch');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Şifreler eşleşmiyor',
      }, { status: 400 });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır',
      }, { status: 400 });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir email adresi girin',
      }, { status: 400 });
    }

    console.log('🔗 AdminDb available:', !!adminDb);

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection not available',
      }, { status: 503 });
    }

    // Firebase Admin varsa gerçek kayıt işlemi
    try {
      console.log('🔍 Checking if user exists...');
      
      // Check if user already exists
      const existingUser = await adminDb.collection('users').doc(email).get();
      
      if (existingUser.exists) {
        console.log('❌ User already exists:', email);
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Bu email adresi zaten kayıtlı',
        }, { status: 400 });
      }

      console.log('🔐 Hashing password...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      console.log('💾 Creating user document...');
      
      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData = {
        uid: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
        provider: 'credentials',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('users').doc(email).set(userData);

      console.log('✅ User created successfully:', email);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Hesap başarıyla oluşturuldu',
        data: {
          uid: userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      });

    } catch (firebaseError) {
      console.error('❌ Firebase operation failed:', firebaseError);
      console.error('Firebase error details:', {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      });

      // Firebase hatası durumunda fallback
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Hesap oluşturulurken bir hata oluştu: ${firebaseError.message}`,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ General registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Hesap oluşturulurken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}