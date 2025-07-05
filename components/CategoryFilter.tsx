// components/CategoryFilter.tsx
'use client';

import { Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  currentCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryFilter({
  categories,
  currentCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
            currentCategory === category.id
              ? 'bg-white text-orange-500 shadow-lg scale-105'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </button>
      ))}
    </div>
  );
}