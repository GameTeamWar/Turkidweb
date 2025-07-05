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
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/10 backdrop-blur-lg border-r border-white/20
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
              ⚙️
            </div>
            <span className="text-white text-xl font-bold">Turkid Admin</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-white/20 text-white translate-x-1' 
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-1'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-white/80 text-sm mb-2">Turkid FastFood</div>
            <div className="text-white/60 text-xs">Admin Panel v1.0</div>
          </div>
        </div>
      </div>
    </>
  );
}