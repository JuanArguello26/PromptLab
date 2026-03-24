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
      <h3 className="text-sm text-gray-400 mb-2">Historial reciente</h3>
      {history.slice(0, 5).map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full p-3 bg-[#111118] border border-[#1f1f2e] rounded-lg text-left hover:border-[#2a2a3e] transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-[#1f1f2e] rounded text-gray-400">
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
