'use client';

import { useState, useEffect } from 'react';
import { HistoryItem } from '@/types';

interface HistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  showExport?: boolean;
  onExportJson?: () => void;
  onExportPdf?: () => void;
}

export default function History({ history, onSelect, showExport, onExportJson, onExportPdf }: HistoryProps) {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const [search, setSearch] = useState('');
  
  const filtered = search 
    ? history.filter(h => 
        h.description.toLowerCase().includes(search.toLowerCase()) ||
        h.category.toLowerCase().includes(search.toLowerCase()) ||
        h.prompt.toLowerCase().includes(search.toLowerCase())
      )
    : history;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        document.getElementById('history-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-400 flex items-center gap-2">
          <span>📜</span> Historial ({filtered.length})
        </h3>
        {showExport && history.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={onExportJson}
              className="text-xs px-2 py-1 glass-card rounded hover:scale-105 transition-all"
              title="Exportar todo como JSON (Ctrl+E)"
            >
              JSON
            </button>
            <button
              onClick={onExportPdf}
              className="text-xs px-2 py-1 glass-card rounded hover:scale-105 transition-all"
              title="Exportar todo como PDF (Ctrl+Shift+E)"
            >
              PDF
            </button>
          </div>
        )}
      </div>
      {history.length > 3 && (
        <div className="relative mb-3">
          <input
            id="history-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar... (/)"
            className="w-full p-2 pl-8 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm p-4 text-center">No se encontraron resultados</p>
      ) : (
        filtered.slice(0, 5).map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full p-4 glass-card rounded-lg text-left hover:scale-[1.01] transition-all animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
                {capitalize(item.category)}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleDateString('es-ES')}
              </span>
            </div>
            <p className="text-sm text-gray-300 truncate">{item.description}</p>
          </button>
        ))
      )}
    </div>
  );
}