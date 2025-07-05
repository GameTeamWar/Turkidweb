// scripts/create-admin.js
const admin = require('firebase-admin');

// Firebase yapılandırması (restmyapp-firebase.json'dan)
const serviceAccount = require('../restmyapp-firebase.json');

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://restmyapp.firebaseio.com"
  });
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('🔧 Admin kullanıcısı oluşturuluyor...');
    
    const adminEmail = 'admin@turkid.com'; // İstediğiniz email
    const adminPassword = 'admin1';   // İstediğiniz şifre
    
    // Şifreyi hash'le
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Admin kullanıcısını oluştur
    const userId = `admin_${Date.now()}`;
    
    const adminData = {
      uid: userId,
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      provider: 'credentials',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(adminEmail).set(adminData);

    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Şifre:', adminPassword);
    console.log('🌐 Admin Panel: http://localhost:3000/admin');
    console.log('🔑 Giriş: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    admin.app().delete();
    process.exit(0);
  }
}

// Script'i çalıştır
createAdminUser();