'use client';

import { useState } from 'react';

interface PromptResultProps {
  prompt: string;
  onRegenerate: () => void;
  isLoading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function PromptResult({ prompt, onRegenerate, isLoading, isFavorite, onToggleFavorite }: PromptResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prompt Exportado</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; white-space: pre-wrap; line-height: 1.6; }
            </style>
          </head>
          <body>${prompt}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#111118] border border-[#1f1f2e] rounded-xl">
        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">{prompt}</pre>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 min-w-[120px] py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all flex items-center justify-center gap-2"
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
          className="flex-1 min-w-[120px] py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
        <button
          onClick={onToggleFavorite}
          className={`py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${isFavorite ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-[#1f1f2e] text-white hover:bg-[#2a2a3e]'}`}
        >
          <span>{isFavorite ? '⭐' : '☆'}</span>
        </button>
        <button
          onClick={handleExportTxt}
          className="py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all flex items-center justify-center gap-2"
        >
          <span>📄</span> TXT
        </button>
        <button
          onClick={handleExportPdf}
          className="py-2 px-4 bg-[#1f1f2e] text-white rounded-xl hover:bg-[#2a2a3e] transition-all flex items-center justify-center gap-2"
        >
          <span>📑</span> PDF
        </button>
      </div>
    </div>
  );
}
