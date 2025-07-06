// lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Environment variables'ları kontrol et
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    console.log('📊 Environment check:', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey && privateKey.length > 50,
      nodeEnv: process.env.NODE_ENV
    });

    if (projectId && clientEmail && privateKey) {
      console.log('✅ All Firebase credentials found, initializing...');
      
      // Private key'i düzgün format et
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: formattedPrivateKey,
        }),
        // databaseURL kaldırdık - sadece Firestore kullanacağız
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('📊 Project ID:', projectId);
      
      // Firestore settings - authentication işlemlerini iyileştirmek için
      const db = admin.firestore();
      db.settings({
        ignoreUndefinedProperties: true
      });
      
    } else {
      console.error('❌ Firebase credentials missing:', {
        projectId: !projectId ? 'FIREBASE_PROJECT_ID missing' : 'OK',
        clientEmail: !clientEmail ? 'FIREBASE_CLIENT_EMAIL missing' : 'OK',
        privateKey: !privateKey ? 'FIREBASE_PRIVATE_KEY missing' : 'OK'
      });
      throw new Error('Firebase credentials missing');
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    throw error; // Hatayı yukarı fırlat, mock mode'a geçme
  }
}

// Exports - Firebase başarısız olursa app crash etsin, mock'a geçmesin
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();

// Debug bilgisi
console.log('🔍 Firebase Admin status:', {
  appsInitialized: admin.apps.length,
  adminDbAvailable: !!adminDb,
  adminAuthAvailable: !!adminAuth,
  adminStorageAvailable: !!adminStorage
});

export default admin;