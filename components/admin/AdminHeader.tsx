// components/admin/AdminHeader.tsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Bars3Icon, 
  HomeIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export function AdminHeader() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Ürünler', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Siparişler', href: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Analitik', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Kullanıcılar', href: '/admin/users', icon: UserGroupIcon },
  ];

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
              ⚙️
            </div>
            <span className="text-xl font-bold text-white">Turkid Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all duration-300"
            >
              Ana Siteye Dön
            </Link>

            <div className="relative">
              <div className="flex items-center gap-2 bg-white/30 border border-white/40 rounded-full px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm hidden sm:block">
                  {session?.user?.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/30 rounded-lg transition-colors duration-300"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/20 mt-4 pt-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}