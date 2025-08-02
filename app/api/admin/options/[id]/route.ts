import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    console.log('🔍 Fetching option from Firebase:', params.id);

    const optionDoc = await adminDb.collection('productOptions').doc(params.id).get();
    
    if (!optionDoc.exists) {
      return NextResponse.json({ success: false, error: 'Opsiyon bulunamadı' }, { status: 404 });
    }

    const data = optionDoc.data();
    const option = {
      id: optionDoc.id,
      ...data,
      choices: data?.choices || [],
      createdAt: data?.createdAt || new Date().toISOString(),
      updatedAt: data?.updatedAt || new Date().toISOString()
    };

    console.log('✅ Option found:', option.name);
    
    return NextResponse.json({
      success: true,
      data: option
    });
  } catch (error) {
    console.error('❌ Option fetch error:', error);
    return NextResponse.json(
      { success: false, error: `Opsiyon yüklenirken hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    const data = await request.json();
    
    console.log('📝 Updating option:', params.id, data);

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('productOptions').doc(params.id).update(updateData);
    
    // Güncellenmiş opsiyonu getir
    const updatedDoc = await adminDb.collection('productOptions').doc(params.id).get();
    const updatedData = updatedDoc.data();
    const updatedOption = {
      id: updatedDoc.id,
      ...updatedData,
      choices: updatedData?.choices || []
    };

    console.log('✅ Option updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedOption
    });
  } catch (error) {
    console.error('❌ Option update error:', error);
    return NextResponse.json(
      { success: false, error: `Opsiyon güncellenirken hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin bağlantısı mevcut değil',
      }, { status: 500 });
    }

    console.log('🗑️ Deleting option:', params.id);

    // Opsiyonun ürünlerde kullanılıp kullanılmadığını kontrol et
    const productsUsingOption = await adminDb
      .collection('products')
      .where('selectedOptions', 'array-contains', params.id)
      .get();

    if (!productsUsingOption.empty) {
      return NextResponse.json({
        success: false,
        error: 'Bu opsiyon ürünlerde kullanıldığı için silinemez'
      }, { status: 400 });
    }

    await adminDb.collection('productOptions').doc(params.id).delete();
    console.log('✅ Option deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Opsiyon silindi'
    });
  } catch (error) {
    console.error('❌ Option delete error:', error);
    return NextResponse.json(
      { success: false, error: `Opsiyon silinirken hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}
