// components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TagIcon,
  TicketIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Analiz Raporu', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Ürün Yönetimi', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Kategori Yönetimi', href: '/admin/categories', icon: TagIcon },
  { name: 'Sipariş Takibi', href: '/admin/orders', icon: ClipboardDocumentListIcon },
  { name: 'Kullanıcı Yönetimi', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Kupon Yönetimi', href: '/admin/coupons', icon: TicketIcon },
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
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'bg-orange-500/20 text-orange-300 border-r-2 border-orange-500' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                  onClick={() => onClose()}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
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