// app/api/admin/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

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
      const mockTags: Tag[] = [
        {
          id: 'populer',
          name: 'Popüler',
          slug: 'populer',
          color: '#ef4444',
          icon: '🔥',
          description: 'En çok tercih edilen ürünler',
          isActive: true,
          sortOrder: 1,
          usageCount: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'yeni',
          name: 'Yeni',
          slug: 'yeni',
          color: '#10b981',
          icon: '✨',
          description: 'Yeni eklenen ürünler',
          isActive: true,
          sortOrder: 2,
          usageCount: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'acili',
          name: 'Acılı',
          slug: 'acili',
          color: '#f97316',
          icon: '🌶️',
          description: 'Acılı ürünler',
          isActive: true,
          sortOrder: 3,
          usageCount: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'vejetaryen',
          name: 'Vejetaryen',
          slug: 'vejetaryen',
          color: '#22c55e',
          icon: '🌱',
          description: 'Vejetaryen ürünler',
          isActive: true,
          sortOrder: 4,
          usageCount: 6,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'vegan',
          name: 'Vegan',
          slug: 'vegan',
          color: '#84cc16',
          icon: '🥬',
          description: 'Vegan ürünler',
          isActive: true,
          sortOrder: 5,
          usageCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'glutensiz',
          name: 'Glutensiz',
          slug: 'glutensiz',
          color: '#8b5cf6',
          icon: '🌾',
          description: 'Gluten içermeyen ürünler',
          isActive: true,
          sortOrder: 6,
          usageCount: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cok-satan',
          name: 'Çok Satan',
          slug: 'cok-satan',
          color: '#f59e0b',
          icon: '⭐',
          description: 'En çok satan ürünler',
          isActive: true,
          sortOrder: 7,
          usageCount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sinirli-surede',
          name: 'Sınırlı Sürede',
          slug: 'sinirli-surede',
          color: '#dc2626',
          icon: '⏰',
          description: 'Sınırlı süre ürünleri',
          isActive: true,
          sortOrder: 8,
          usageCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sicak',
          name: 'Sıcak',
          slug: 'sicak',
          color: '#dc2626',
          icon: '🔥',
          description: 'Sıcak servis edilen ürünler',
          isActive: true,
          sortOrder: 9,
          usageCount: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'soguk',
          name: 'Soğuk',
          slug: 'soguk',
          color: '#06b6d4',
          icon: '❄️',
          description: 'Soğuk servis edilen ürünler',
          isActive: true,
          sortOrder: 10,
          usageCount: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return NextResponse.json<ApiResponse<Tag[]>>({
        success: true,
        data: mockTags,
      });
    }

    // Firebase Admin varsa gerçek data
    const snapshot = await adminDb.collection('tags').orderBy('sortOrder', 'asc').get();
    const tags = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tag[];

    return NextResponse.json<ApiResponse<Tag[]>>({
      success: true,
      data: tags,
    });

  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Etiketler yüklenirken bir hata oluştu',
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
    const { name, slug, color, icon, description, isActive, sortOrder } = body;

    // Validation
    if (!name || !slug || !color) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik (ad, slug, renk)',
      }, { status: 400 });
    }

    const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tagData: Tag = {
      id: tagId,
      name: name.trim(),
      slug: slug.trim(),
      color: color.trim(),
      icon: icon?.trim() || '',
      description: description?.trim() || '',
      isActive: Boolean(isActive),
      sortOrder: sortOrder || 999,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Firebase Admin yoksa mock response
    if (!adminDb) {
      console.log('🔄 Etiket eklendi (Mock Mode):', tagData.name);
      
      return NextResponse.json<ApiResponse<Tag>>({
        success: true,
        message: 'Etiket başarıyla oluşturuldu (Mock Mode)',
        data: tagData,
      });
    }

    // Firebase Admin varsa gerçek kayıt
    await adminDb.collection('tags').doc(tagId).set(tagData);

    return NextResponse.json<ApiResponse<Tag>>({
      success: true,
      message: 'Etiket başarıyla oluşturuldu',
      data: tagData,
    });

  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Etiket oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}