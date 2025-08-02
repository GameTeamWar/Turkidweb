// app/api/admin/categories/route.ts - Sadece gerçek data
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { Category } from '@/types/admin';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection not available',
      }, { status: 503 });
    }

    console.log('📂 Fetching categories from Firebase...');

    // Firebase Admin'den gerçek data
    const snapshot = await adminDb.collection('categories').orderBy('sortOrder', 'asc').get();
    console.log(`📊 Found ${snapshot.docs.length} categories`);
    
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Tarih alanlarını string'e çevir
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    }) as Category[];

    console.log('✅ Categories fetched successfully');

    return NextResponse.json<ApiResponse<Category[]>>({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error('❌ Get categories error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Kategoriler yüklenirken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil. Lütfen Firebase yapılandırmasını kontrol edin.',
      }, { status: 500 });
    }

    const body = await request.json();
    const { name, slug, icon, description, isActive, sortOrder } = body;

    // Validation
    if (!name || !slug || !icon) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (ad, slug, icon)',
      }, { status: 400 });
    }

    // Slug benzersizlik kontrolü
    const existingSlug = await adminDb.collection('categories').where('slug', '==', slug.trim()).get();
    if (!existingSlug.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu slug zaten kullanılıyor',
      }, { status: 400 });
    }

    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const categoryData: Category = {
      id: categoryId,
      name: name.trim(),
      slug: slug.trim(),
      icon: icon.trim(),
      description: description?.trim() || '',
      isActive: Boolean(isActive),
      sortOrder: sortOrder || 999,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('categories').doc(categoryId).set(categoryData);

    console.log('✅ Category created:', categoryData.name);

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: categoryData,
    });

  } catch (error) {
    console.error('❌ Create category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Kategori oluşturulurken bir hata oluştu: ${error.message}`,
    }, { status: 500 });
  }
}