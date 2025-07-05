// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminDb } from './firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from 'next-auth';

export const authConfig: NextAuthOptions = {
  providers: [
    // Google Provider - sadece credentials varsa ekle
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Firebase Admin SDK yoksa basit test kullanıcısı döndür
        if (!adminDb) {
          console.warn('⚠️ Firebase Admin not available, using test credentials');
          
          // Test kullanıcısı için basit kontrol
          if (credentials.email === 'admin@turkid.com' && credentials.password === 'admin123') {
            return {
              id: 'test-admin',
              email: 'admin@turkid.com',
              name: 'Admin User',
              role: 'admin',
            } as User & { role: string };
          }
          
          if (credentials.email === 'user@test.com' && credentials.password === 'test123') {
            return {
              id: 'test-user',
              email: 'user@test.com',
              name: 'Test User',
              role: 'user',
            } as User & { role: string };
          }
          
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Check user in Firestore
          const userDoc = await adminDb.collection('users').doc(email).get();
          
          if (!userDoc.exists) {
            return null;
          }

          const userData = userDoc.data();
          
          if (!userData?.password) {
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(password, userData.password);
          
          if (!isValid) {
            return null;
          }

          return {
            id: userData.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'user',
            image: userData.image,
          } as User & { role: string };

        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Firebase Admin yoksa Google OAuth'u atla
        if (!adminDb) {
          console.warn('⚠️ Firebase Admin not available, skipping Google user save');
          return true;
        }

        try {
          const email = user.email;
          if (!email) return false;

          // Check if user exists in Firestore
          const userDoc = await adminDb.collection('users').doc(email).get();
          
          if (!userDoc.exists) {
            // Create new user
            await adminDb.collection('users').doc(email).set({
              uid: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
              provider: 'google',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            // Update existing user
            await adminDb.collection('users').doc(email).update({
              name: user.name,
              image: user.image,
              updatedAt: new Date().toISOString(),
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error saving user:', error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
      }
      
      if (account?.provider === 'google' || account?.provider === 'credentials') {
        // Firebase Admin yoksa default role ver
        if (!adminDb) {
          token.role = token.email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
          return token;
        }

        try {
          const email = token.email;
          if (email) {
            const userDoc = await adminDb.collection('users').doc(email).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              token.role = userData?.role || 'user';
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          token.role = 'user';
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type declarations for NextAuth v4
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}