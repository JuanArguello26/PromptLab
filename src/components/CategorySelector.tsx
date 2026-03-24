'use client';

import { Category } from '@/types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export default function CategorySelector({ categories, selectedCategory, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
            selectedCategory === category.id
              ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
              : 'border-[#1f1f2e] bg-[#111118] hover:border-[#2a2a3e]'
          }`}
        >
          <span className="text-3xl mb-2 block">{category.icon}</span>
          <h3 className="font-semibold text-white mb-1">{category.name}</h3>
          <p className="text-xs text-gray-400">{category.description}</p>
        </button>
      ))}
    </div>
  );
}
