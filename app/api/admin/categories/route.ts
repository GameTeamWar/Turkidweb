// app/api/admin/categories/route.ts
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
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      // Firebase Admin yoksa örnek data döndür
      const sampleCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Et Burger',
          slug: 'et-burger',
          icon: '🍔',
          description: 'Dana eti ile hazırlanan burgerler',
          isActive: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-2',
          name: 'Tavuk Burger',
          slug: 'tavuk-burger',
          icon: '🐔',
          description: 'Tavuk eti ile hazırlanan burgerler',
          isActive: true,
          sortOrder: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-3',
          name: 'İzmir Kumru',
          slug: 'izmir-kumru',
          icon: '🥖',
          description: 'Geleneksel İzmir kumruları',
          isActive: true,
          sortOrder: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-4',
          name: 'Dönerler',
          slug: 'doner',
          icon: '🌯',
          description: 'Tavuk ve et döner çeşitleri',
          isActive: true,
          sortOrder: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-5',
          name: 'Sandwiçler',
          slug: 'sandwich',
          icon: '🥪',
          description: 'Çeşitli sandwich seçenekleri',
          isActive: true,
          sortOrder: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-6',
          name: 'Tostlar',
          slug: 'tost',
          icon: '🍞',
          description: 'Sıcak tost çeşitleri',
          isActive: true,
          sortOrder: 6,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-7',
          name: 'Yan Ürünler',
          slug: 'yan-urun',
          icon: '🍟',
          description: 'Patates kızartması ve diğer yan ürünler',
          isActive: true,
          sortOrder: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-8',
          name: 'İçecekler',
          slug: 'icecek',
          icon: '🥤',
          description: 'Soğuk ve sıcak içecekler',
          isActive: true,
          sortOrder: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return NextResponse.json<ApiResponse<Category[]>>({
        success: true,
        data: sampleCategories,
      });
    }

    const snapshot = await adminDb.collection('categories').orderBy('sortOrder', 'asc').get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];

    return NextResponse.json<ApiResponse<Category[]>>({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategoriler yüklenirken bir hata oluştu',
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
    const { name, slug, icon, description, isActive, sortOrder } = body;

    // Validation
    if (!name || !slug || !icon) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (name, slug, icon)',
      }, { status: 400 });
    }

    // Slug format validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Slug sadece küçük harf, rakam ve tire içerebilir',
      }, { status: 400 });
    }

    // Check if slug already exists
    const existingCategory = await adminDb.collection('categories').where('slug', '==', slug).get();
    if (!existingCategory.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu slug zaten kullanılıyor',
      }, { status: 400 });
    }

    // Check if name already exists
    const existingName = await adminDb.collection('categories').where('name', '==', name.trim()).get();
    if (!existingName.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kategori adı zaten kullanılıyor',
      }, { status: 400 });
    }

    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const categoryData: Omit<Category, 'id'> = {
      name: name.trim(),
      slug: slug.trim(),
      icon: icon.trim(),
      description: description?.trim() || '',
      isActive: Boolean(isActive),
      sortOrder: parseInt(sortOrder) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('categories').doc(categoryId).set(categoryData);

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: { id: categoryId, ...categoryData },
    });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategori oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}