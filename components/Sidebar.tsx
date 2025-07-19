// components/Sidebar.tsx
'use client';

import { Category, Filters } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  categories: Category[];
  currentCategory: string;
  onCategoryChange: (categoryId: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  categories,
  currentCategory,
  onCategoryChange,
  filters,
  onFiltersChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
    // Mobilde kategori seçince sidebar'ı kapat
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const filterOptions = [
    { 
      key: 'vegetarian' as keyof Filters, 
      label: 'Vejetaryen', 
      icon: '🌱',
      description: 'Et içermeyen ürünler'
    },
    { 
      key: 'spicy' as keyof Filters, 
      label: 'Acılı', 
      icon: '🌶️',
      description: 'Baharatlı ve acılı lezzetler'
    },
    { 
      key: 'discount' as keyof Filters, 
      label: 'İndirimli', 
      icon: '🏷️',
      description: 'Özel fiyatlarla'
    },
    { 
      key: 'popular' as keyof Filters, 
      label: 'Popüler', 
      icon: '⭐',
      description: 'En çok tercih edilenler'
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 h-[calc(100vh-80px)] overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-white text-xl font-semibold">Menü</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Header */}
          <h2 className="text-white text-xl font-semibold mb-6 hidden lg:block">Kategoriler</h2>

          {/* Categories */}
          <div className="space-y-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                  currentCategory === category.id
                    ? 'bg-white/20 text-white translate-x-1 shadow-lg'
                    : 'text-white hover:bg-white/20 hover:translate-x-1'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <div className="flex-1">
                  <span className="font-medium">{category.name}</span>
                </div>
                {currentCategory === category.id && (
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Filters Section */}
          <div className="pt-6 border-t border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span>
              Filtreler
            </h3>
            <div className="space-y-4">
              {filterOptions.map((filter) => (
                <label 
                  key={filter.key} 
                  className="flex items-start gap-3 text-white text-sm cursor-pointer p-3 rounded-lg hover:bg-white/10 transition-colors duration-300"
                >
                  <input
                    type="checkbox"
                    checked={filters[filter.key]}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        [filter.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500 focus:ring-2 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{filter.icon}</span>
                      <span>{filter.label}</span>
                    </div>
                    <div className="text-xs text-white/40">{filter.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Active Filters Summary */}
            {Object.values(filters).some(Boolean) && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <div className="text-white/80 text-sm font-medium mb-2">Aktif Filtreler:</div>
                <div className="flex flex-wrap gap-2">
                  {filterOptions
                    .filter(filter => filters[filter.key])
                    .map(filter => (
                      <span 
                        key={filter.key}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs"
                      >
                        {filter.icon} {filter.label}
                      </span>
                    ))
                  }
                </div>
                <button
                  onClick={() => onFiltersChange({
                    vegetarian: false,
                    spicy: false,
                    discount: false,
                    popular: false,
                  })}
                  className="mt-3 text-white/60 hover:text-white text-xs underline"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
            <div className="text-orange-200 text-sm font-medium mb-2">💡 İpucu</div>
            <div className="text-white/80 text-xs leading-relaxed">
              Filtreleri kullanarak istediğiniz özelliklere sahip ürünleri kolayca bulabilirsiniz.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}