// components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Siparişler', href: '/admin/orders', icon: '📋' },
  { name: 'Ürünler', href: '/admin/products', icon: '🍔' },
  { name: 'Kategoriler', href: '/admin/categories', icon: '📁' },
  { name: 'Etiketler', href: '/admin/tags', icon: '🏷️' },
  { name: 'Opsiyonlar', href: '/admin/options', icon: '⚙️' },
  { name: 'Kuponlar', href: '/admin/coupons', icon: '🎫' },
  { name: 'Müşteriler', href: '/admin/customers', icon: '👥' },
  { name: 'Raporlar', href: '/admin/reports', icon: '📈' },
  { name: 'Ayarlar', href: '/admin/settings', icon: '🔧' },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-lg border-r border-white/20
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <h2 className="text-white text-xl font-bold">Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-white/80"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-all duration-300 hover:bg-white/20
                  ${pathname === item.href
                    ? 'bg-orange-500/20 text-orange-300 border-l-4 border-orange-500'
                    : 'hover:text-orange-300'
                  }
                `}
                onClick={() => onClose()}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <div className="text-white/60 text-xs text-center">
            Turkid Admin Panel v1.0
          </div>
        </div>
      </div>
    </>
  );
}