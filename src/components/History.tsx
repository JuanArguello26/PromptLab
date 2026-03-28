'use client';

import { HistoryItem } from '@/types';

interface HistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export default function History({ history, onSelect }: HistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
        <span>📜</span> Historial reciente
      </h3>
      {history.slice(0, 5).map((item, index) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full p-4 glass-card rounded-lg text-left hover:scale-[1.01] transition-all animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
              {item.category}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(item.timestamp).toLocaleDateString('es-ES')}
            </span>
          </div>
          <p className="text-sm text-gray-300 truncate">{item.description}</p>
        </button>
      ))}
    </div>
  );
}
