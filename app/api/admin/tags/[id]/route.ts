// app/api/admin/tags/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { Tag } from '../route';
import type { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    if (!adminDb) {
      // Mock data for testing
      const mockTag: Tag = {
        id: params.id,
        name: 'Örnek Etiket',
        slug: 'ornek-etiket',
        color: '#ef4444',
        icon: '🏷️',
        description: 'Bu bir örnek etiket açıklamasıdır.',
        isActive: true,
        sortOrder: 1,
        usageCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<Tag>>({
        success: true,
        data: mockTag,
      });
    }

    const tagDoc = await adminDb.collection('tags').doc(params.id).get();
    
    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Etiket bulunamadı',
      }, { status: 404 });
    }

    const tagData = tagDoc.data();
    const tag = {
      id: tagDoc.id,
      ...tagData,
    } as Tag;

    return NextResponse.json<ApiResponse<Tag>>({
      success: true,
      data: tag,
    });

  } catch (error) {
    console.error('Get tag error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Etiket yüklenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Yetkisiz erişim',
      }, { status: 401 });
    }

    const body = await request.json();

    if (!adminDb) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    // Mevcut etiketi kontrol et
    const tagDoc = await adminDb.collection('tags').doc(params.id).get();
    
    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Etiket bulunamadı',
      }, { status: 404 });
    }

    const currentData = tagDoc.data();

    // Eğer ad değiştiriliyorsa, aynı isimde başka etiket var mı kontrol et
    if (body.name && body.name !== currentData?.name) {
      const existingTagQuery = await adminDb
        .collection('tags')
        .where('name', '==', body.name.trim())
        .get();

      if (!existingTagQuery.empty) {
        const conflictingTag = existingTagQuery.docs.find(doc => doc.id !== params.id);
        if (conflictingTag) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Bu isimde başka bir etiket zaten mevcut',
          }, { status: 400 });
        }
      }
    }

    // Slug değiştiriliyorsa kontrol et
    if (body.slug && body.slug !== currentData?.slug) {
      const existingSlugQuery = await adminDb
        .collection('tags')
        .where('slug', '==', body.slug.trim())
        .get();

      if (!existingSlugQuery.empty) {
        const conflictingTag = existingSlugQuery.docs.find(doc => doc.id !== params.id);
        if (conflictingTag) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Bu slug başka bir etiket tarafından kullanılıyor',
          }, { status: 400 });
        }
      }
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('tags').doc(params.id).update(updateData);

    // Güncellenmiş etiketi getir
    const updatedDoc = await adminDb.collection('tags').doc(params.id).get();
    const updatedData = updatedDoc.data();
    const updatedTag = {
      id: updatedDoc.id,
      ...updatedData,
    } as Tag;

    return NextResponse.json<ApiResponse<Tag>>({
      success: true,
      message: 'Etiket başarıyla güncellendi',
      data: updatedTag,
    });

  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Etiket güncellenirken bir hata oluştu',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        error: 'Veritabanı bağlantısı mevcut değil',
      }, { status: 500 });
    }

    // Etiketin var olup olmadığını kontrol et
    const tagDoc = await adminDb.collection('tags').doc(params.id).get();
    
    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Etiket bulunamadı',
      }, { status: 404 });
    }

    const tagData = tagDoc.data();

    // Bu etiketi kullanan ürün var mı kontrol et
    const productsQuery = await adminDb
      .collection('products')
      .where('tags', 'array-contains', tagData?.slug)
      .get();

    if (!productsQuery.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Bu etiket ${productsQuery.size} üründe kullanıldığı için silinemez. Önce ürünlerden bu etiketi kaldırın.`,
      }, { status: 400 });
    }

    // Etiketi sil
    await adminDb.collection('tags').doc(params.id).delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Etiket başarıyla silindi',
    });

  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Etiket silinirken bir hata oluştu',
    }, { status: 500 });
  }
}