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