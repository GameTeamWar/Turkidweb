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
            <h2 className="text-white text-xl font-semibold">Kategoriler</h2>
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
                    ? 'bg-white/20 text-white translate-x-1'
                    : 'text-white hover:bg-white/20 hover:translate-x-1'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Filters Section */}
          <div className="pt-6 border-t border-white/20">
            <h3 className="text-white font-semibold mb-4">Filtreler</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                {Object.entries({
                  vegetarian: 'Vejetaryen',
                  spicy: 'Acılı',
                  discount: 'İndirimli',
                  popular: 'Popüler',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[key as keyof Filters]}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          [key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}