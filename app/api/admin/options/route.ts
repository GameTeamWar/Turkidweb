import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export interface ProductOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  choices: ProductOptionChoice[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'sortOrder';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    console.log('🔍 Options API called with params:', { search, isActive, sortBy, sortOrder });

    let query: any = adminDb.collection('productOptions');

    // Only filter by isActive if specifically requested
    if (isActive !== null && isActive !== '' && isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
      console.log('📝 Added isActive filter:', isActive === 'true');
    }

    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.get();
    
    console.log(`📊 Found ${snapshot.docs.length} options in database`);
    
    let options = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        choices: data.choices || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }) as ProductOption[];

    // Apply client-side search filter
    if (search) {
      options = options.filter(option =>
        option.name.toLowerCase().includes(search.toLowerCase())
      );
      console.log(`🔍 After search filter: ${options.length} options`);
    }

    console.log(`✅ Returning ${options.length} options to client`);

    return NextResponse.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('❌ Options fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Opsiyonlar yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    const newOption = {
      name: data.name,
      type: data.type,
      isRequired: data.isRequired,
      minSelect: data.minSelect,
      maxSelect: data.maxSelect,
      sortOrder: data.sortOrder || 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
      choices: data.choices || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('productOptions').add(newOption);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...newOption }
    });
  } catch (error) {
    console.error('Option create error:', error);
    return NextResponse.json(
      { success: false, error: 'Opsiyon oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
