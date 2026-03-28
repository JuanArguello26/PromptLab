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
const FAVORITES_KEY = 'promptlab_favorites';
const STATS_KEY = 'promptlab_stats';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [stats, setStats] = useState({ total: 0, favorites: 0 });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    const savedTheme = localStorage.getItem('promptlab_theme');
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
    }
    const savedApiKey = localStorage.getItem('promptlab_custom_api_key');
    if (savedApiKey) {
      setCustomApiKey(savedApiKey);
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
    const newStats = { ...stats, total: stats.total + 1 };
    setStats(newStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  };

  const toggleFavorite = () => {
    if (!currentPromptId) return;
    const updatedFavorites = isFavorite
      ? favorites.filter(f => f.id !== currentPromptId)
      : [...favorites, history.find(h => h.id === currentPromptId) || {
          id: currentPromptId,
          category: selectedCategory || '',
          description: currentDescription,
          prompt: generatedPrompt || '',
          timestamp: Date.now(),
          isFavorite: true
        }];
    setFavorites(updatedFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
    const newStats = { ...stats, favorites: updatedFavorites.length };
    setStats(newStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    showToast(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', 'success');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('promptlab_theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('promptlab_custom_api_key', customApiKey.trim());
      showToast('API key guardada correctamente', 'success');
      setShowSettings(false);
    }
  };

  const handleSubmit = async (description: string, promptId?: string) => {
    if (!selectedCategory) return;
    setCurrentDescription(description);
    setIsLoading(true);
    setIsFavorite(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, description, apiKey: customApiKey }),
      });
      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      const newItem = {
        category: selectedCategory,
        description,
        prompt: data.prompt
      };
      const newItemWithId: HistoryItem = {
        ...newItem,
        id: promptId || crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setCurrentPromptId(newItemWithId.id);
      const updated = [newItemWithId, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      const newStats = { ...stats, total: stats.total + 1 };
      setStats(newStats);
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
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
    setCurrentPromptId(item.id);
    setIsFavorite(item.isFavorite || favorites.some(f => f.id === item.id));
  };

  const handleNewGeneration = () => {
    setSelectedCategory(null);
    setGeneratedPrompt(null);
    setCurrentDescription('');
    setCurrentPromptId(null);
    setIsFavorite(false);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      <header className="text-center mb-8 relative">
        <div className="absolute top-0 right-0 flex gap-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="p-2 bg-[#1f1f2e] rounded-lg hover:bg-[#2a2a3e] transition-all"
            title="Favoritos"
          >
            ⭐ {favorites.length}
          </button>
          <button
            onClick={handleThemeToggle}
            className="p-2 bg-[#1f1f2e] rounded-lg hover:bg-[#2a2a3e] transition-all"
            title="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-[#1f1f2e] rounded-lg hover:bg-[#2a2a3e] transition-all"
            title="Configuración"
          >
            ⚙️
          </button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="text-cyan-400">Prompt</span>Lab
        </h1>
        <p className="text-gray-400">Genera prompts profesionales para IA</p>
        <div className="text-sm text-gray-500 mt-2">
          📊 {stats.total}生成 | ⭐ {stats.favorites} favoritos
        </div>
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
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
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

      {showFavorites && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">⭐ Favoritos</h2>
              <button onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {favorites.length === 0 ? (
              <p className="text-gray-400">No hay favoritos guardados</p>
            ) : (
              <div className="space-y-3">
                {favorites.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleHistorySelect(item);
                      setShowFavorites(false);
                    }}
                    className="w-full p-3 bg-[#1f1f2e] rounded-lg text-left hover:bg-[#2a2a3e] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-[#111118] rounded text-gray-400">{item.category}</span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{item.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">⚙️ Configuración</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tu API Key de Groq (opcional)</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full p-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Usa tu propia API key para evitar límites de la app</p>
              </div>
              <button
                onClick={handleSaveApiKey}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all"
              >
                Guardar
              </button>
              <div className="border-t border-[#1f1f2e] pt-4">
                <h3 className="text-sm text-gray-400 mb-2">Estadísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#1f1f2e] rounded-lg text-center">
                    <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
                    <div className="text-xs text-gray-400">Prompts生成</div>
                  </div>
                  <div className="p-3 bg-[#1f1f2e] rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.favorites}</div>
                    <div className="text-xs text-gray-400">Favoritos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
