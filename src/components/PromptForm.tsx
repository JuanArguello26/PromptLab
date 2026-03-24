'use client';

import { useState } from 'react';

interface PromptFormProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function PromptForm({ onSubmit, isLoading, disabled }: PromptFormProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && !disabled) {
      onSubmit(description);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe qué tipo de prompt necesitas..."
        disabled={disabled}
        className="w-full h-32 p-4 bg-[#111118] border border-[#1f1f2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 resize-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!description.trim() || isLoading || disabled}
        className="w-full py-3 px-6 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando...
          </span>
        ) : (
          'Generar Prompt'
        )}
      </button>
    </form>
  );
}
