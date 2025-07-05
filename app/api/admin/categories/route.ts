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
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    // Firebase Admin yoksa mock data döndür
    if (!adminDb) {
      console.log('🔄 Firebase Admin bağlantısı yok, mock kategoriler kullanılıyor...');
      
      const mockCategories: Category[] = [
        {
          id: 'et-burger',
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
          id: 'tavuk-burger',
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
          id: 'izmir-kumru',
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
          id: 'doner',
          name: 'Dönerler',
          slug: 'doner',
          icon: '🌯',
          description: 'Et ve tavuk döner çeşitleri',
          isActive: true,
          sortOrder: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sandwich',
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
          id: 'tost',
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
          id: 'yan-urun',
          name: 'Yan Ürünler',
          slug: 'yan-urun',
          icon: '🍟',
          description: 'Patates, soğan halkası vb.',
          isActive: true,
          sortOrder: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'icecek',
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
        data: mockCategories,
      });
    }

    // Firebase Admin varsa gerçek data
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
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
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

    // Firebase Admin yoksa mock response
    if (!adminDb) {
      console.log('🔄 Kategori eklendi (Mock Mode):', categoryData.name);
      
      return NextResponse.json<ApiResponse<Category>>({
        success: true,
        message: 'Kategori başarıyla oluşturuldu (Mock Mode)',
        data: categoryData,
      });
    }

    // Firebase Admin varsa gerçek kayıt
    await adminDb.collection('categories').doc(categoryId).set(categoryData);

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: categoryData,
    });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategori oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}