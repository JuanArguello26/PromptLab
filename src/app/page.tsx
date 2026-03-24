'use client';

import { useState, useEffect } from 'react';
import { categories, getCategoryById } from '@/lib/prompts';
import { HistoryItem } from '@/types';
import CategorySelector from '@/components/CategorySelector';
import PromptForm from '@/components/PromptForm';
import PromptResult from '@/components/PromptResult';
import History from '@/components/History';
import Toast from '@/components/Toast';

const HISTORY_KEY = 'promptlab_history';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async (description: string) => {
    if (!selectedCategory) return;
    setCurrentDescription(description);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, description }),
      });
      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      saveToHistory({ category: selectedCategory, description, prompt: data.prompt });
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar el prompt. Por favor intenta de nuevo.');
      showToast('Error al generar el prompt', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (currentDescription) {
      await handleSubmit(currentDescription);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSelectedCategory(item.category);
    setCurrentDescription(item.description);
    setGeneratedPrompt(item.prompt);
  };

  const handleNewGeneration = () => {
    setSelectedCategory(null);
    setGeneratedPrompt(null);
    setCurrentDescription('');
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="text-cyan-400">Prompt</span>Lab
        </h1>
        <p className="text-gray-400">Genera prompts profesionales para IA</p>
      </header>

      {generatedPrompt ? (
        <div className="space-y-6">
          <button
            onClick={handleNewGeneration}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span> Nueva generación
          </button>
          <PromptResult
            prompt={generatedPrompt}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">Selecciona una categoría</h2>
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </section>

          {selectedCategory && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">
                Describe tu prompt ({getCategoryById(selectedCategory)?.icon} {getCategoryById(selectedCategory)?.name})
              </h2>
              <PromptForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={!selectedCategory}
              />
            </section>
          )}

          {history.length > 0 && !selectedCategory && (
            <section>
              <History history={history} onSelect={handleHistorySelect} />
            </section>
          )}
        </div>
      )}
    </main>
  );
}
