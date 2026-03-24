'use client';

import { useState } from 'react';

interface PromptResultProps {
  prompt: string;
  onRegenerate: () => void;
  isLoading: boolean;
}

export default function PromptResult({ prompt, onRegenerate, isLoading }: PromptResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#111118] border border-[#1f1f2e] rounded-xl">
        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">{prompt}</pre>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <span>✓</span> Copiado
            </>
          ) : (
            <>
              <span>📋</span> Copiar
            </>
          )}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando...
            </>
          ) : (
            <>
              <span>🔄</span> Regenerar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
