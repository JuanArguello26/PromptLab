'use client';

import { useRef, useCallback, useState } from 'react';
import { Category } from '@/types';
import { categorySections, categoriesBySection } from '@/lib/prompts';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export default function CategorySelector({ categories, selectedCategory, onSelect }: CategorySelectorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const allCategories = Object.values(categoriesBySection).flat();
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (index + 1) % allCategories.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (index - 1 + allCategories.length) % allCategories.length;
        break;
      default:
        return;
    }

    buttonRefs.current[newIndex]?.focus();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {categorySections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const sectionCategories = categoriesBySection[section.id] || [];
          
          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1 ${
                isExpanded 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 animate-glow-pulse' 
                  : 'glass-card border-white/5 hover:border-white/20 hover:scale-105'
              }`}
            >
              <span className="text-2xl">{section.icon}</span>
              <span className="text-sm font-medium text-white">{section.name}</span>
              <span className="text-xs text-gray-400">{sectionCategories.length} categorías</span>
            </button>
          );
        })}
      </div>

      {expandedSection && (
        <div className="mt-6 p-4 glass rounded-xl animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{categorySections.find(s => s.id === expandedSection)?.icon}</span>
            <h3 className="text-lg font-semibold text-white">
              {categorySections.find(s => s.id === expandedSection)?.name}
            </h3>
            <button 
              onClick={() => setExpandedSection(null)}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(categoriesBySection[expandedSection] || []).map((category, index) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  ref={(el) => { buttonRefs.current[index] = el; }}
                  onClick={() => {
                    onSelect(category.id);
                    setExpandedSection(null);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`category-card glass-card p-3 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group ${
                    isSelected
                      ? 'selected animate-glow-pulse'
                      : 'border-white/5 hover:border-white/20 hover:scale-105'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-2xl mb-1 block relative z-10" aria-hidden="true">{category.icon}</span>
                  <h4 className="font-medium text-white text-sm relative z-10">{category.name}</h4>
                  <p className="text-xs text-gray-400 relative z-10 line-clamp-2">{category.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
