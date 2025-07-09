// scripts/seed-data.ts - İlk data'ları oluştur
// Bu dosyayı scripts/ klasörüne kaydet ve `npx tsx scripts/seed-data.ts` ile çalıştır

import { adminDb } from '../lib/firebase-admin';

const seedCategories = async () => {
  if (!adminDb) {
    console.error('❌ Firebase Admin not available');
    return;
  }

  const categories = [
    {
      id: 'populer',
      name: 'Popüler Ürünler',
      slug: 'populer',
      icon: '🔥',
      description: 'En çok tercih edilen ürünler',
      isActive: true,
      sortOrder: 0,
    },
    {
      id: 'et-burger',
      name: 'Et Burger',
      slug: 'et-burger',
      icon: '🍔',
      description: 'Dana eti ile hazırlanan burgerler',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'tavuk-burger',
      name: 'Tavuk Burger',
      slug: 'tavuk-burger',
      icon: '🐔',
      description: 'Tavuk eti ile hazırlanan burgerler',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'izmir-kumru',
      name: 'İzmir Kumru',
      slug: 'izmir-kumru',
      icon: '🥖',
      description: 'Geleneksel İzmir kumruları',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'doner',
      name: 'Dönerler',
      slug: 'doner',
      icon: '🌯',
      description: 'Et ve tavuk döner çeşitleri',
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'yan-urun',
      name: 'Yan Ürünler',
      slug: 'yan-urun',
      icon: '🍟',
      description: 'Patates, soğan halkası vb.',
      isActive: true,
      sortOrder: 5,
    },
    {
      id: 'icecek',
      name: 'İçecekler',
      slug: 'icecek',
      icon: '🥤',
      description: 'Soğuk ve sıcak içecekler',
      isActive: true,
      sortOrder: 6,
    },
  ];

  console.log('📂 Creating categories...');
  
  for (const category of categories) {
    const categoryData = {
      ...category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await adminDb.collection('categories').doc(category.id).set(categoryData);
    console.log(`✅ Created category: ${category.name}`);
  }
};

const seedProducts = async () => {
  if (!adminDb) {
    console.error('❌ Firebase Admin not available');
    return;
  }

  const products = [
    {
      name: 'Klasik Cheeseburger',
      description: 'Dana eti, cheddar peyniri, marul, domates, özel sos',
      price: 45.90,
      originalPrice: 52.90,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      categories: ['et-burger', 'populer'],
      category: 'et-burger',
      discount: 13,
      tags: ['populer', 'cok-satan'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'BBQ Burger',
      description: 'Dana eti, barbekü sos, cheddar peyniri, karamelize soğan',
      price: 48.90,
      originalPrice: 55.90,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
      categories: ['et-burger'],
      category: 'et-burger',
      discount: 13,
      tags: ['yeni', 'acili'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Crispy Chicken Burger',
      description: 'Çıtır tavuk göğsü, özel sos, marul ve domates',
      price: 38.90,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e1e596f3?w=400&h=300&fit=crop',
      categories: ['tavuk-burger', 'populer'],
      category: 'tavuk-burger',
      discount: 0,
      tags: ['populer', 'yeni'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Buffalo Chicken Burger',
      description: 'Acılı tavuk, ranch sos, marul ve domates',
      price: 41.90,
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
      categories: ['tavuk-burger'],
      category: 'tavuk-burger',
      discount: 0,
      tags: ['acili', 'yeni'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Özel İzmir Kumru',
      description: 'Sucuk, salam, kaşar peyniri, domates ve turşu',
      price: 32.90,
      originalPrice: 39.90,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      categories: ['izmir-kumru'],
      category: 'izmir-kumru',
      discount: 18,
      tags: ['populer', 'geleneksel'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Tavuk Döner',
      description: 'Özel baharatlarla marine edilmiş tavuk döner',
      price: 39.90,
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
      categories: ['doner', 'populer'],
      category: 'doner',
      discount: 0,
      tags: ['populer', 'acili'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Çıtır Patates',
      description: 'Altın sarısı çıtır patates kızartması',
      price: 18.90,
      originalPrice: 22.90,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
      categories: ['yan-urun'],
      category: 'yan-urun',
      discount: 17,
      tags: ['populer', 'vejetaryen'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
    {
      name: 'Kola (330ml)',
      description: 'Soğuk kola, buzlu servis',
      price: 8.90,
      image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
      categories: ['icecek'],
      category: 'icecek',
      discount: 0,
      tags: ['soguk'],
      hasOptions: false,
      options: [],
      isActive: true,
    },
  ];

  console.log('🍔 Creating products...');
  
  for (const product of products) {
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const productData = {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await adminDb.collection('products').doc(productId).set(productData);
    console.log(`✅ Created product: ${product.name}`);
  }
};

const createAdminUser = async () => {
  if (!adminDb) {
    console.error('❌ Firebase Admin not available');
    return;
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminData = {
    uid: 'admin_user',
    name: 'Admin User',
    email: 'admin@turkid.com',
    password: hashedPassword,
    role: 'admin',
    provider: 'credentials',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection('users').doc('admin@turkid.com').set(adminData);
  console.log('✅ Created admin user: admin@turkid.com / admin123');
};

// Ana fonksiyon
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedCategories();
    await seedProducts();
    await createAdminUser();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Created data:');
    console.log('- 7 categories');
    console.log('- 8 products');  
    console.log('- 1 admin user (admin@turkid.com / admin123)');
    console.log('');
    console.log('🚀 You can now start using the application!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Script'i çalıştır
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };