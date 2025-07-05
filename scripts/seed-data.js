// scripts/seed-data.js
const admin = require('firebase-admin');

// Firebase Admin SDK Configuration
const serviceAccount = {
  type: "service_account",
  project_id: "restmyapp",
  private_key_id: "0ac993901299e8861260302999b1b0f95dac79a0",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDf8gxiQp5fFPlN\n67ZdrC1mXlUV4bVd1CUOkW9F8clY/PUT76SffpbFQ4OjNonhyIeBrYXUDcFZcu+z\neNmBrWfRg+LspCAapREHgaFFHN/pxOUR/SKR8/W+isa4Khiwb1o/JeXnmD3wSeMj\nWqFXb5Ol/wC9iNcaUhz7Bzz3A7m2OQ3FpRvzwnZhXg8aAneetJoEUIIzDtz3/Ve0\ncgm/BVDoPiI0nGgcrfAWMsx7Bo41LGm1YkA4INmdE1AFuL3cpS/TPtud4FhdXAy4\nZ3W5z8ywgT9ijCu1+a44Tm6ex9/VPLpMimBG7V6fE0rGRF92b/ox55akplp542ba\nQ2a9+CNlAgMBAAECggEABOQ9GAJbgjkrjuOoqpghr7w8wIsbEo8ZNh3AH/d9jeeM\nlOBlqKQzt+BXJkABOADQ0OjQ5QZd5E3J5ZIsshPvEhj+4mtdVien3RGcS62rSGho\nFoIAeM6q3fwbBhfJTUVJY9q4kFv3cmGyx+lpX8cMoxIUWo98H1OO1X7deonGyy+e\nX/l6duxSp26E7w7W4nCzTq6PymOWbetAURg7qR5GuVwov5X3vYswlMp/w4tug9Ai\nRD34yI/I24XMnUrpNdile4BpdzeoND7YCjll55qkyudTo5SKFBLiNNUrzWHwHAzG\neAXP/B8ZkCQmAJlwh3Vq3/Gk5TsE9yU4xWOfDHhqiwKBgQD7VuXabayc71D9Yp2s\nGE5UjajP/6/7n2tH3mgkhEwcBYQ0Bt9kR8Jl+5GzqpFOd/e0Q+ToCw0FCSQlZSRG\nqqt6GBrNqSuOWmxtZ6rrvv8zsSJ1jyXBOQ6y6fdPv7M59F+EVXxln/DIRXU/ubzP\nIhUSN+mygV4eAMHVIw9MPnQdswKBgQDkGRy1EVhckwPLPgGkZl+FU/wcQfei7pRY\nM6YmcNT0NofWcH50UN014H57nKaYqjkTcUSmUf6QTEiPBpmP1AYrYH2+zIlB2ObO\n9ljn3eyxZltiB5ZnhFilVn/H8uNheg41MkmeYtYEBXA8c7oPrVWSKUoxPMf6Rnzg\n60NnpfiehwKBgBNurYjMz/q2OhHNLRmgK3Y4GaQzRZzzv2yoEm84V1YXSxhmq6Dq\nN2qBH8u/VUq21cz3LtyN9iy8fzHw9vQLwARJltDt0nNIJHf0+u8NLlgFyv9B2Q5u\nZeeJVViyHp5NeZEWtu54hjpFvIH3z1RIc06cShJGFEvHjTT4Z/diIMInAoGBALEG\nqFgC2TAnzUb8nauo5DOG5eBMdlPWk/0MQMQOx8etVqlf71R4ueYpkCCBiG5tlhR3\n0Q7ADjCRc7LFLYMJy6v4nD7rYQ9gtmkjmgaCH0PjK8MeHmXCukW/pzZYVI5/eu1g\nVPB+xpiiW+Qe8OVf4kyojPM/t/iOojaxgEO99QGbAoGBAN01A5j9jqSpJeObLsRl\ngcZs/Xhoevj67Rk59rNU148Er4gaJPvlSeOs11mADornmksoUuy1JSFDIDGYCU20\nCXWZQQdxSrgvMEOtHOb4YiltrNTS9P+SO/95RXC5Ry+Twrq1HnF0l6/ahwqyyLHv\nULKS1zQDlpjsIKx3cRQ2b2Fb\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@restmyapp.iam.gserviceaccount.com",
  client_id: "115288232223077154627",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40restmyapp.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://restmyapp.firebaseio.com"
  });
}

const db = admin.firestore();

// Sample Products Data
const sampleProducts = [
  {
    id: 'burger-1',
    name: 'Klasik Cheeseburger',
    description: 'Özel soslu dana eti, cheddar peyniri, marul, domates ve soğan ile hazırlanmış klasik burger',
    price: 45.90,
    originalPrice: 52.90,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    category: 'et-burger',
    discount: 13,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'burger-2',
    name: 'Crispy Chicken Burger',
    description: 'Çıtır tavuk göğsü, özel sos, marul ve domates ile',
    price: 38.90,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e1e596f3?w=400&h=300&fit=crop',
    category: 'tavuk-burger',
    discount: 0,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:05:00Z',
    updatedAt: '2024-01-15T10:05:00Z'
  },
  {
    id: 'kumru-1',
    name: 'Özel İzmir Kumru',
    description: 'Sucuk, salam, kaşar peyniri, domates ve turşu ile geleneksel İzmir kumrusu',
    price: 32.90,
    originalPrice: 39.90,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    category: 'izmir-kumru',
    discount: 18,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:10:00Z',
    updatedAt: '2024-01-15T10:10:00Z'
  },
  {
    id: 'doner-1',
    name: 'Tavuk Döner',
    description: 'Özel baharatlarla marine edilmiş tavuk döner, pilav ve salata ile',
    price: 39.90,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
    category: 'doner',
    discount: 0,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z'
  },
  {
    id: 'patates-1',
    name: 'Çıtır Patates',
    description: 'Altın sarısı çıtır patates kızartması, özel soslar ile',
    price: 18.90,
    originalPrice: 22.90,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    category: 'yan-urun',
    discount: 17,
    tags: ['popular'],
    hasOptions: false,
    isActive: true,
    createdAt: '2024-01-15T10:20:00Z',
    updatedAt: '2024-01-15T10:20:00Z'
  },
  {
    id: 'sandwich-1',
    name: 'Club Sandwich',
    description: 'Tavuk, jambon, marul, domates, cheddar peyniri ile üç katlı sandwich',
    price: 42.90,
    originalPrice: 48.90,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop',
    category: 'sandwich',
    discount: 12,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:25:00Z',
    updatedAt: '2024-01-15T10:25:00Z'
  },
  {
    id: 'tost-1',
    name: 'Karışık Tost',
    description: 'Kaşar peyniri, sucuk, domates ve marul ile hazırlanmış tost',
    price: 24.90,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
    category: 'tost',
    discount: 0,
    tags: [],
    hasOptions: false,
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'kola-1',
    name: 'Kola',
    description: 'Soğuk kola, buzlu servis',
    price: 8.90,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
    category: 'icecek',
    discount: 0,
    tags: [],
    hasOptions: false,
    isActive: true,
    createdAt: '2024-01-15T10:35:00Z',
    updatedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: 'burger-3',
    name: 'BBQ Burger',
    description: 'Barbekü soslu dana eti, cheddar peyniri, karamelize soğan ve marul',
    price: 48.90,
    originalPrice: 55.90,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    category: 'et-burger',
    discount: 13,
    tags: ['popular'],
    hasOptions: true,
    isActive: true,
    createdAt: '2024-01-15T10:40:00Z',
    updatedAt: '2024-01-15T10:40:00Z'
  },
  {
    id: 'ayran-1',
    name: 'Ayran',
    description: 'Geleneksel Türk ayranı, taze yoğurt ile',
    price: 6.90,
    originalPrice: 8.90,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop',
    category: 'icecek',
    discount: 22,
    tags: ['popular'],
    hasOptions: false,
    isActive: true,
    createdAt: '2024-01-15T10:45:00Z',
    updatedAt: '2024-01-15T10:45:00Z'
  }
];

// Function to add sample products
async function addSampleProducts() {
  try {
    console.log('🚀 Sample ürünler ekleniyor...');
    
    const batch = db.batch();
    
    sampleProducts.forEach((product) => {
      const { id, ...productData } = product;
      const docRef = db.collection('products').doc(id);
      batch.set(docRef, productData);
    });
    
    await batch.commit();
    
    console.log('✅ Sample ürünler başarıyla eklendi!');
    console.log(`📦 Toplam ${sampleProducts.length} ürün eklendi:`);
    
    sampleProducts.forEach((product) => {
      console.log(`   • ${product.name} (${product.category})`);
    });
    
    console.log('\n🎉 Artık http://localhost:3000 adresini ziyaret edebilirsiniz!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    // Admin app'i kapat
    admin.app().delete();
  }
}

// Script'i çalıştır
addSampleProducts();