'use client';

import { useRef, useCallback } from 'react';
import { Category } from '@/types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export default function CategorySelector({ categories, selectedCategory, onSelect }: CategorySelectorProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (index + 1) % categories.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (index - 1 + categories.length) % categories.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = categories.length - 1;
        break;
      default:
        return;
    }

    buttonRefs.current[newIndex]?.focus();
  }, [categories.length]);

  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
      role="radiogroup"
      aria-label="Categorías de prompts"
    >
      {categories.map((category, index) => {
        const isSelected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            ref={(el) => { buttonRefs.current[index] = el; }}
            onClick={() => onSelect(category.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="radio"
            aria-checked={isSelected}
            aria-pressed={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`category-card glass-card p-4 rounded-xl border transition-all duration-300 text-left ${
              isSelected
                ? 'selected'
                : 'border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-3xl mb-2 block" aria-hidden="true">{category.icon}</span>
            <h3 className="font-semibold text-white mb-1">{category.name}</h3>
            <p className="text-xs text-gray-400">{category.description}</p>
          </button>
        );
      })}
    </div>
  );
}
