// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { Category } from '@/types/admin';
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
      const mockCategory: Category = {
        id: params.id,
        name: 'Örnek Kategori',
        slug: 'ornek-kategori',
        icon: '🍔',
        description: 'Bu bir örnek kategori açıklamasıdır.',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<Category>>({
        success: true,
        data: mockCategory,
      });
    }

    const categoryDoc = await adminDb.collection('categories').doc(params.id).get();
    
    if (!categoryDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kategori bulunamadı',
      }, { status: 404 });
    }

    const categoryData = categoryDoc.data();
    const category = {
      id: categoryDoc.id,
      ...categoryData,
    } as Category;

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: category,
    });

  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategori yüklenirken bir hata oluştu',
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

    // Mevcut kategoriyi kontrol et
    const categoryDoc = await adminDb.collection('categories').doc(params.id).get();
    
    if (!categoryDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kategori bulunamadı',
      }, { status: 404 });
    }

    const currentData = categoryDoc.data();

    // Eğer ad değiştiriliyorsa, aynı isimde başka kategori var mı kontrol et
    if (body.name && body.name !== currentData?.name) {
      const existingCategoryQuery = await adminDb
        .collection('categories')
        .where('name', '==', body.name.trim())
        .get();

      if (!existingCategoryQuery.empty) {
        const conflictingCategory = existingCategoryQuery.docs.find(doc => doc.id !== params.id);
        if (conflictingCategory) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Bu isimde başka bir kategori zaten mevcut',
          }, { status: 400 });
        }
      }
    }

    // Slug değiştiriliyorsa kontrol et
    if (body.slug && body.slug !== currentData?.slug) {
      const existingSlugQuery = await adminDb
        .collection('categories')
        .where('slug', '==', body.slug.trim())
        .get();

      if (!existingSlugQuery.empty) {
        const conflictingCategory = existingSlugQuery.docs.find(doc => doc.id !== params.id);
        if (conflictingCategory) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Bu slug başka bir kategori tarafından kullanılıyor',
          }, { status: 400 });
        }
      }
    }

    // Sıralama değiştiriliyorsa ve swapWith varsa
    if (body.sortOrder !== undefined && body.swapWith) {
      const targetDoc = await adminDb.collection('categories').doc(body.swapWith).get();
      if (targetDoc.exists) {
        const targetData = targetDoc.data();
        const currentSortOrder = currentData?.sortOrder;
        
        // Batch update ile iki kategoriyi değiştir
        const batch = adminDb.batch();
        
        batch.update(adminDb.collection('categories').doc(params.id), {
          sortOrder: targetData?.sortOrder,
          updatedAt: new Date().toISOString(),
        });
        
        batch.update(adminDb.collection('categories').doc(body.swapWith), {
          sortOrder: currentSortOrder,
          updatedAt: new Date().toISOString(),
        });
        
        await batch.commit();
        
        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Kategori sıralaması güncellendi',
        });
      }
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // swapWith alanını kaldır
    delete updateData.swapWith;

    await adminDb.collection('categories').doc(params.id).update(updateData);

    // Güncellenmiş kategoriyi getir
    const updatedDoc = await adminDb.collection('categories').doc(params.id).get();
    const updatedData = updatedDoc.data();
    const updatedCategory = {
      id: updatedDoc.id,
      ...updatedData,
    } as Category;

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategory,
    });

  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategori güncellenirken bir hata oluştu',
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

    // Kategorinin var olup olmadığını kontrol et
    const categoryDoc = await adminDb.collection('categories').doc(params.id).get();
    
    if (!categoryDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kategori bulunamadı',
      }, { status: 404 });
    }

    const categoryData = categoryDoc.data();

    // Bu kategoriye ait ürün var mı kontrol et
    const productsQuery = await adminDb
      .collection('products')
      .where('category', '==', categoryData?.slug)
      .get();

    if (!productsQuery.empty) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Bu kategoriye ait ürünler bulunduğu için kategori silinemez. Önce ürünleri başka kategorilere taşıyın.',
      }, { status: 400 });
    }

    // Kategoriyi sil
    await adminDb.collection('categories').doc(params.id).delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Kategori başarıyla silindi',
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Kategori silinirken bir hata oluştu',
    }, { status: 500 });
  }
}