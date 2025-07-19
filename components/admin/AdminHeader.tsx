// components/admin/AdminHeader.tsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { data: session } = useSession();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-300"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Center - Current Time */}
          <div className="hidden lg:flex items-center text-white/80">
            <span className="text-sm">
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>

          {/* Right - Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-300 relative"
              >
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {notificationDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white/90 backdrop-blur-lg border border-white/50 rounded-xl shadow-xl z-50">
                  <div className="p-4 border-b border-white/20">
                    <h3 className="text-gray-800 font-semibold">Bildirimler</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 border-b border-white/10 hover:bg-white/20 transition-colors">
                      <div className="text-sm text-gray-800 font-medium">Yeni sipariş alındı</div>
                      <div className="text-xs text-gray-600">2 dakika önce</div>
                    </div>
                    <div className="p-4 border-b border-white/10 hover:bg-white/20 transition-colors">
                      <div className="text-sm text-gray-800 font-medium">Stok azaldı: Cheeseburger</div>
                      <div className="text-xs text-gray-600">5 dakika önce</div>
                    </div>
                    <div className="p-4 hover:bg-white/20 transition-colors">
                      <div className="text-sm text-gray-800 font-medium">Yeni kullanıcı kaydı</div>
                      <div className="text-xs text-gray-600">10 dakika önce</div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/20">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Tümünü gör
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ana Site Link */}
            <Link
              href="/"
              className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all duration-300 text-sm"
            >
              Ana Site
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 hover:bg-white/30 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm hidden sm:block">
                  {session?.user?.name}
                </span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg border border-white/50 rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b border-white/20">
                    <div className="text-sm font-medium text-gray-800">{session?.user?.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-gray-600">{session?.user?.email || 'Email bulunamadı'}</div>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      👤 Profil
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      ⚙️ Ayarlar
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🚪 Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}