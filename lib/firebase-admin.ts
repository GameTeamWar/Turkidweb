// lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Sadece gerekli environment variables varsa initialize et
    if (process.env.GOOGLE_CLOUD_PROJECT_ID && 
        process.env.GOOGLE_CLOUD_CLIENT_EMAIL && 
        process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          privateKey: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.GOOGLE_CLOUD_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: `${process.env.GOOGLE_CLOUD_PROJECT_ID}.appspot.com`,
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin credentials missing - running without admin SDK');
      console.warn('Missing:', {
        projectId: !process.env.GOOGLE_CLOUD_PROJECT_ID,
        clientEmail: !process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        privateKey: !process.env.GOOGLE_CLOUD_PRIVATE_KEY
      });
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
  }
}

// Safe exports - null eğer admin initialize edilmemişse
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminStorage = admin.apps.length > 0 ? admin.storage() : null;

export default admin;