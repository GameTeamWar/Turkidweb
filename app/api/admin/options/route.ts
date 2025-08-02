import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

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

// Mock data storage - replace with your database implementation
let options: ProductOption[] = [
  {
    id: '1',
    name: 'Baharat Seçimi',
    type: 'radio',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    sortOrder: 1,
    isActive: true,
    choices: [
      { id: '1', name: 'Baharatlı', price: 0, isActive: true, sortOrder: 1 },
      { id: '2', name: 'Baharatsız', price: 0, isActive: true, sortOrder: 2 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sos Seçimi',
    type: 'checkbox',
    isRequired: false,
    minSelect: 0,
    maxSelect: 3,
    sortOrder: 2,
    isActive: true,
    choices: [
      { id: '3', name: 'Ketçap', price: 0, isActive: true, sortOrder: 1 },
      { id: '4', name: 'Mayonez', price: 0, isActive: true, sortOrder: 2 },
      { id: '5', name: 'Barbekü Sos', price: 2, isActive: true, sortOrder: 3 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'sortOrder';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    let filteredOptions = [...options];

    // Search filter
    if (search) {
      filteredOptions = filteredOptions.filter(option =>
        option.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Active filter
    if (isActive !== null) {
      filteredOptions = filteredOptions.filter(option =>
        option.isActive === (isActive === 'true')
      );
    }

    // Sort
    filteredOptions.sort((a, b) => {
      let aValue = a[sortBy as keyof ProductOption];
      let bValue = b[sortBy as keyof ProductOption];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1;
      }
      return aValue < bValue ? -1 : 1;
    });

    return NextResponse.json({
      success: true,
      data: filteredOptions
    });
  } catch (error) {
    console.error('Options fetch error:', error);
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

    const data = await request.json();
    
    const newOption: ProductOption = {
      id: Date.now().toString(),
      name: data.name,
      type: data.type,
      isRequired: data.isRequired,
      minSelect: data.minSelect,
      maxSelect: data.maxSelect,
      sortOrder: data.sortOrder || options.length + 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
      choices: data.choices || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    options.push(newOption);

    return NextResponse.json({
      success: true,
      data: newOption
    });
  } catch (error) {
    console.error('Option create error:', error);
    return NextResponse.json(
      { success: false, error: 'Opsiyon oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
