// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { RegisterForm } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Hesap başarıyla oluşturuldu!');
        
        // Otomatik giriş yap
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (signInResult && signInResult.error) {
          toast.error('Giriş yapılırken hata oluştu, lütfen manuel giriş yapın');
          router.push('/auth/signin');
        } else if (signInResult && signInResult.ok) {
          toast.success('Hoş geldiniz! Ana sayfaya yönlendiriliyorsunuz...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        }
      } else {
        toast.error(result.error || 'Hesap oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Hesap oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      await signIn('google', {
        callbackUrl: '/',
      });
      
    } catch (error) {
      console.error('Google sign up error:', error);
      toast.error('Google ile kayıt olurken hata oluştu');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
            🍽️
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Turkid'e Katılın</h1>
          <p className="text-white/80">Yeni hesap oluşturun ve lezzetli yemekleri keşfedin</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Ad soyad gerekli',
                minLength: {
                  value: 2,
                  message: 'Ad soyad en az 2 karakter olmalıdır',
                },
                pattern: {
                  value: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
                  message: 'Sadece harf ve boşluk kullanabilirsiniz',
                },
                validate: value => value?.trim().length >= 2 || 'Ad soyad en az 2 karakter olmalıdır'
              })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              placeholder="Adınız Soyadınız"
            />
            {errors.name && (
              <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Adresi
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email adresi gerekli',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Geçerli bir email adresi girin',
                },
              })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Şifre
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Şifre gerekli',
                minLength: {
                  value: 6,
                  message: 'Şifre en az 6 karakter olmalıdır',
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
                  message: 'Şifre en az bir harf ve bir rakam içermelidir',
                },
              })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-300 text-sm mt-1">{errors.password.message}</p>
            )}
            <p className="text-white/60 text-xs mt-1">
              En az 6 karakter, bir harf ve bir rakam içermelidir
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Şifre Tekrar
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Şifre tekrarı gerekli',
                validate: (value) =>
                  value === password || 'Şifreler eşleşmiyor',
              })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-red-300 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-orange-500 py-3 px-4 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                Hesap oluşturuluyor...
              </div>
            ) : (
              'Hesap Oluştur'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/80">veya</span>
            </div>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full bg-white/20 border border-white/30 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Google ile kayıt olunuyor...
            </div>
          ) : (
            'Google ile Kayıt Ol'
          )}
        </button>

        {/* Terms */}
        <div className="text-center mt-4">
          <p className="text-white/60 text-xs">
            Hesap oluşturarak{' '}
            <Link href="/terms" className="text-white/80 hover:text-white underline">
              Kullanım Şartları
            </Link>{' '}
            ve{' '}
            <Link href="/privacy" className="text-white/80 hover:text-white underline">
              Gizlilik Politikası
            </Link>
            'nı kabul etmiş olursunuz.
          </p>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-white/80">
            Zaten hesabınız var mı?{' '}
            <Link 
              href="/auth/signin" 
              className="text-white font-semibold hover:underline transition-all duration-300 hover:text-orange-200"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link 
            href="/" 
            className="text-white/60 hover:text-white text-sm transition-colors duration-300"
          >
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}