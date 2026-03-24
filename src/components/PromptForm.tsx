'use client';

import { useState } from 'react';

interface PromptFormProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder?: string;
}

export default function PromptForm({ onSubmit, isLoading, disabled, placeholder = 'Describe qué tipo de prompt necesitas...' }: PromptFormProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor describe qué tipo de prompt necesitas.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Sé más específico (mínimo 10 caracteres) para un mejor resultado.');
      return;
    }
    setError('');
    onSubmit(description);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt-description" className="block text-sm font-medium text-gray-300 mb-2">
          Descripción del prompt
        </label>
        <textarea
          id="prompt-description"
          value={description}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={error ? 'description-error' : undefined}
          aria-invalid={!!error}
          className="w-full h-32 p-4 bg-[#111118] border border-[#1f1f2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 resize-none disabled:opacity-50 transition-colors"
        />
        <div className="flex justify-between items-center mt-2">
          {error ? (
            <p id="description-error" className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {description.length}/500 caracteres
            </p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={!description.trim() || isLoading || disabled}
        className="w-full py-3 px-6 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
