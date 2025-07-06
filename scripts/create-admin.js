// scripts/create-admin.js
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Firebase Admin SDK yapılandırması
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    const email = 'admin@turkid.com';
    const password = 'admin123'; // Güvenli bir şifre kullanın
    const name = 'Admin User';

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 12);

    // Admin kullanıcısını oluştur
    const adminUser = {
      uid: `admin_${Date.now()}`,
      email: email,
      name: name,
      password: hashedPassword,
      role: 'admin',
      provider: 'credentials',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Firestore'a kaydet
    await db.collection('users').doc(email).set(adminUser);

    console.log('✅ Admin kullanıcı başarıyla oluşturuldu!');
    console.log('📧 Email:', email);
    console.log('🔑 Şifre:', password);
    console.log('⚠️  Güvenlik için şifreyi değiştirmeyi unutmayın!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Admin kullanıcı oluşturulurken hata:', error);
    process.exit(1);
  }
}

createAdminUser();