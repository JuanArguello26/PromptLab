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
            tabIndex={isSelected ? 0 : -1}
            className={`category-card glass-card p-4 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group ${
              isSelected
                ? 'selected animate-glow-pulse'
                : 'border-white/5 hover:border-white/20 hover:scale-105'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-3xl mb-2 block relative z-10 group-hover:animate-bounce" aria-hidden="true">{category.icon}</span>
            <h3 className="font-semibold text-white mb-1 relative z-10">{category.name}</h3>
            <p className="text-xs text-gray-400 relative z-10">{category.description}</p>
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
