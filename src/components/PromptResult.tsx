'use client';

import { useState } from 'react';

interface PromptResultProps {
  prompt: string;
  onRegenerate: () => void;
  isLoading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onError?: (message: string) => void;
}

export default function PromptResult({ prompt, onRegenerate, isLoading, isFavorite, onToggleFavorite, onError }: PromptResultProps) {
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
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        onError?.('Por favor permite las ventanas emergentes');
        return;
      }
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
    } catch (err) {
      onError?.('Error al exportar PDF');
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 rounded-xl animate-fade-in-up relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono leading-relaxed relative z-10">{prompt}</pre>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-gradient-shift" />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 min-w-[120px] py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-1"
        >
          {copied ? (
            <>
              <span className="text-green-400 animate-bounce">✓</span> Copiado
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
          className="flex-1 min-w-[120px] py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-fade-in-up stagger-2"
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
              <span className="animate-spin-slow">🔄</span> Regenerar
            </>
          )}
        </button>
        <button
          onClick={onToggleFavorite}
          className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 animate-fade-in-up stagger-3 ${
            isFavorite 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse-glow' 
              : 'glass-card text-white'
          }`}
        >
          <span className={`text-lg ${isFavorite ? 'animate-bounce' : ''}`}>{isFavorite ? '⭐' : '☆'}</span>
        </button>
        <button
          onClick={handleExportTxt}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-4 hover:animate-breathe"
        >
          <span>📄</span> TXT
        </button>
        <button
          onClick={handleExportPdf}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-5 hover:animate-breathe"
        >
          <span>📑</span> PDF
        </button>
      </div>
    </div>
  );
}
