// lib/firebase.ts - Gerçek data için
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔧 Firebase Client Configuration:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Konfigürasyon kontrolü
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error('❌ Firebase configuration missing! Required environment variables:');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
  throw new Error('Firebase configuration is incomplete');
}

// Initialize Firebase
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase services - Production mode (no emulators)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log('✅ Firebase Client SDK initialized successfully');
console.log('📊 Services status:', {
  firestore: !!db,
  auth: !!auth,
  storage: !!storage,
  projectId: firebaseConfig.projectId
});

// Firebase helper functions for real data operations
export const getTimestamp = () => new Date().toISOString();

// Collection names - centralized
export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  USERS: 'users',
  REVIEWS: 'reviews',
  COUPONS: 'coupons',
} as const;

export default app;