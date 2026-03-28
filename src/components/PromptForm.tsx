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
    const value = e.target.value;
    if (value.length > 500) return;
    setDescription(value);
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
          className="w-full h-32 p-4 glass border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none disabled:opacity-50 transition-all input-glow"
        />
        <div className="flex justify-between items-center mt-2">
          {error ? (
            <p id="description-error" className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : (
            <p className={`text-sm ${description.length > 450 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {description.length}/500 caracteres
            </p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={!description.trim() || isLoading || disabled}
        className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 btn-primary"
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
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generar Prompt
          </span>
        )}
      </button>
    </form>
  );
}
