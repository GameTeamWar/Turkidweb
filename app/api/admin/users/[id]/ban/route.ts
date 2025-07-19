import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse } from '@/types';
import type { Session } from 'next-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { isBanned, banReason, bannedBy } = body;

    // Find user document
    const usersSnapshot = await adminDb.collection('users').get();
    let userDocId = null;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.uid === params.id || data.id === params.id || doc.id === params.id) {
        userDocId = doc.id;
        break;
      }
    }
    
    if (!userDocId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kullanıcı bulunamadı',
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      isBanned: Boolean(isBanned),
      updatedAt: new Date().toISOString(),
    };

    if (isBanned) {
      updateData.bannedAt = new Date().toISOString();
      updateData.bannedBy = bannedBy || 'Admin';
      updateData.banReason = banReason || 'Sebep belirtilmedi';
    } else {
      updateData.bannedAt = null;
      updateData.bannedBy = null;
      updateData.banReason = null;
    }

    await adminDb.collection('users').doc(userDocId).update(updateData);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: isBanned ? 'Kullanıcı başarıyla banlandı' : 'Kullanıcı ban kaldırıldı',
    });

  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ban işlemi sırasında bir hata oluştu',
    }, { status: 500 });
  }
}
