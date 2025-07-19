// app/profile/ProfilePage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ShoppingBagIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: number;
  memberSince: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Profil bilgileri yüklenirken hata oluştu');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ad soyad gerekli');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Profil güncellendi');
        setProfile({ ...profile!, ...formData });
        setEditing(false);
        // Update session if name changed
        if (formData.name !== session?.user?.name) {
          await update({ name: formData.name });
        }
      } else {
        toast.error(result.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Şifre güncellendi');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Şifre güncellenemedi');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Şifre güncelleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white opacity-75"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-white opacity-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profilim</h1>
          <p className="text-white/80">Hesap bilgilerinizi yönetin</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h2 className="text-white text-xl font-semibold mb-2">{profile.name}</h2>
              <p className="text-white/70 text-sm mb-4">{profile.email}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Üyelik:</span>
                  <span className="text-white">{new Date(profile.memberSince).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Toplam Sipariş:</span>
                  <span className="text-white font-semibold">{profile.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Toplam Harcama:</span>
                  <span className="text-white font-semibold">{profile.totalSpent.toFixed(2)} ₺</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  Siparişlerim
                </button>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {showPasswordForm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  Şifre Değiştir
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-semibold flex items-center gap-2">
                  <UserIcon className="w-6 h-6" />
                  Kişisel Bilgiler
                </h3>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  {editing ? 'İptal' : 'Düzenle'}
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-60"
                      placeholder="Adınızı ve soyadınızı girin"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/70 opacity-60"
                      placeholder="E-posta adresiniz"
                    />
                    <p className="text-white/60 text-xs mt-1">E-posta adresi değiştirilemez</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-60"
                      placeholder="Telefon numaranız"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Adres
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!editing}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-60 resize-none"
                    placeholder="Adresinizi girin"
                  />
                </div>

                {editing && (
                  <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Kaydediliyor...
                        </div>
                      ) : (
                        'Değişiklikleri Kaydet'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: profile.name || '',
                          email: profile.email || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
                        });
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
                    >
                      İptal
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <h3 className="text-white text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCardIcon className="w-6 h-6" />
                  Şifre Değiştir
                </h3>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Mevcut Şifre *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="Mevcut şifrenizi girin"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Yeni Şifre *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                        placeholder="Yeni şifrenizi girin"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Yeni Şifre Tekrar *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                        placeholder="Yeni şifrenizi tekrar girin"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Güncelleniyor...
                        </div>
                      ) : (
                        'Şifreyi Güncelle'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}