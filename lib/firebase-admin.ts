// lib/firebase-admin.ts
import admin from 'firebase-admin';

let adminDb: any = null;
let adminAuth: any = null;
let adminStorage: any = null;

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
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('📊 Project ID:', projectId);
      
      // Firestore settings
      adminDb = admin.firestore();
      adminAuth = admin.auth();
      adminStorage = admin.storage();
      
      adminDb.settings({
        ignoreUndefinedProperties: true
      });
      
    } else {
      console.warn('⚠️ Firebase credentials missing, using mock mode');
      console.log('Missing credentials:', {
        projectId: !projectId ? 'FIREBASE_PROJECT_ID missing' : 'OK',
        clientEmail: !clientEmail ? 'FIREBASE_CLIENT_EMAIL missing' : 'OK',
        privateKey: !privateKey ? 'FIREBASE_PRIVATE_KEY missing' : 'OK'
      });
      // Mock mode - credentials eksik ama uygulama çalışsın
      adminDb = null;
      adminAuth = null;
      adminStorage = null;
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    console.warn('🔄 Falling back to mock mode due to Firebase error');
    // Hata durumunda mock mode'a geç
    adminDb = null;
    adminAuth = null;
    adminStorage = null;
  }
} else {
  // Zaten initialize edilmiş
  try {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
    adminStorage = admin.storage();
  } catch (error) {
    console.error('❌ Error accessing Firebase services:', error);
    adminDb = null;
    adminAuth = null;
    adminStorage = null;
  }
}

// Exports - null olabilir, bu normal
export { adminDb, adminAuth, adminStorage };

// Debug bilgisi
console.log('🔍 Firebase Admin status:', {
  appsInitialized: admin.apps.length,
  adminDbAvailable: !!adminDb,
  adminAuthAvailable: !!adminAuth,
  adminStorageAvailable: !!adminStorage,
  mockMode: !adminDb
});

export default admin;