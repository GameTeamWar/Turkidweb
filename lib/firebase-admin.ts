// lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Yeni environment variable isimleriyle initialize et
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('📊 Project ID:', process.env.FIREBASE_PROJECT_ID);
    } else {
      console.warn('⚠️ Firebase Admin credentials missing - running without admin SDK');
      console.warn('Missing:', {
        projectId: !process.env.FIREBASE_PROJECT_ID,
        clientEmail: !process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !process.env.FIREBASE_PRIVATE_KEY
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