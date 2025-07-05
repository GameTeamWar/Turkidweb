// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { ApiResponse, Product } from '@/types';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    let query = adminDb.collection('products').orderBy('createdAt', 'desc');

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (active === 'true') {
      query = query.where('isActive', '==', true);
    }

    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: products,
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürünler yüklenirken bir hata oluştu',
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

    const body = await request.json();
    const { name, description, price, originalPrice, category, tags, hasOptions, isActive, image } = body;

    // Validation
    if (!name || !description || !price || !category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gerekli alanlar eksik',
      }, { status: 400 });
    }

    if (typeof price !== 'number' && isNaN(parseFloat(price))) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir fiyat girin',
      }, { status: 400 });
    }

    if (originalPrice && typeof originalPrice !== 'number' && isNaN(parseFloat(originalPrice))) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Geçerli bir orijinal fiyat girin',
      }, { status: 400 });
    }

    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const parsedPrice = parseFloat(price);
    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    
    const productData: Omit<Product, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      image: image || `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop`,
      category,
      discount: parsedOriginalPrice ? Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100) : 0,
      tags: Array.isArray(tags) ? tags : [],
      hasOptions: Boolean(hasOptions),
      isActive: Boolean(isActive),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('products').doc(productId).set(productData);

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: { id: productId, ...productData },
    });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ürün oluşturulurken bir hata oluştu',
    }, { status: 500 });
  }
}