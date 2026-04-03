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

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass-card p-6 rounded-xl">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-4 bg-white/10 rounded w-3/4" style={{ animationDelay: `${i * 0.1}s` }} />
              {i === 3 && <div className="h-4 bg-white/10 rounded w-1/4" />}
            </div>
          ))}
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 flex-1 bg-white/10 rounded-xl" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function PromptResult({ prompt, onRegenerate, isLoading, isFavorite, onToggleFavorite, onError }: PromptResultProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <SkeletonLoader />;
  }

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

  const handleShare = () => {
    try {
      const shareData = btoa(encodeURIComponent(prompt));
      const shareUrl = `${window.location.origin}?share=${shareData}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onError?.('Error al crear enlace compartido');
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
          title="Copiar al portapapeles"
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
          title="Generar nuevo prompt con la misma descripción"
        >
          <span className="animate-spin-slow">🔄</span> Regenerar
        </button>
        <button
          onClick={handleShare}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-3"
          title="Copiar enlace compartido"
        >
          <span>🔗</span> Compartir
        </button>
        <button
          onClick={onToggleFavorite}
          className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 animate-fade-in-up stagger-4 ${
            isFavorite 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse-glow' 
              : 'glass-card text-white'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <span className={`text-lg ${isFavorite ? 'animate-bounce' : ''}`}>{isFavorite ? '⭐' : '☆'}</span>
        </button>
        <button
          onClick={handleExportTxt}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-4 hover:animate-breathe"
          title="Exportar como archivo de texto"
        >
          <span>📄</span> TXT
        </button>
        <button
          onClick={handleExportPdf}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-5 hover:animate-breathe"
          title="Imprimir o guardar como PDF"
        >
          <span>📑</span> PDF
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(prompt)}
          className="py-3 px-4 glass-card text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 animate-fade-in-up stagger-6 hover:animate-breathe md:hidden"
          title="Copiar solo texto"
        >
          <span>📋</span> Copy
        </button>
      </div>
    </div>
  );
}