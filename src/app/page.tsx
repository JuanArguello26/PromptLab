'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { categories, getCategoryById } from '@/lib/prompts';
import { HistoryItem } from '@/types';
import CategorySelector from '@/components/CategorySelector';
import PromptForm from '@/components/PromptForm';
import PromptResult from '@/components/PromptResult';
import History from '@/components/History';
import Toast from '@/components/Toast';
import AuthModal from '@/components/AuthModal';

const HISTORY_KEY = 'promptlab_history';
const FAVORITES_KEY = 'promptlab_favorites';
const STATS_KEY = 'promptlab_stats';
const USER_KEY = 'promptlab_user';
const FREE_PROMPTS_LIMIT = 10;

interface User {
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

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
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const bgRef = useRef<HTMLDivElement>(null);

  const isPro = user?.plan === 'pro';
  const remainingFree = Math.max(0, FREE_PROMPTS_LIMIT - stats.total);
  const isLimitReached = !isPro && stats.total >= FREE_PROMPTS_LIMIT;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) setStats(JSON.parse(savedStats));
    const savedTheme = localStorage.getItem('promptlab_theme');
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
    const savedApiKey = localStorage.getItem('promptlab_custom_api_key');
    if (savedApiKey) setCustomApiKey(savedApiKey);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user && !localStorage.getItem('promptlab_welcomed')) {
      setShowWelcome(true);
      localStorage.setItem('promptlab_welcomed', 'true');
      setTimeout(() => setShowWelcome(false), 4000);
    }
  }, [user]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    showToast(`Bienvenido${loggedUser.plan === 'pro' ? ', versión PRO activada!' : '!'}`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    showToast('Sesión cerrada', 'info');
  };

  const handleSubmit = async (description: string, promptId?: string) => {
    if (!selectedCategory) return;
    if (isLimitReached && !isPro) {
      setShowAuth(true);
      showToast('Has alcanzado el límite de prompts gratuitos', 'error');
      return;
    }
    setCurrentDescription(description);
    setIsLoading(true);
    setIsFavorite(false);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, description, apiKey: customApiKey }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          showToast('Configura tu API key en settings', 'error');
          setShowSettings(true);
        }
        throw new Error(data.error || 'Error al generar prompt');
      }
      
      setGeneratedPrompt(data.prompt);
      const newItem = { category: selectedCategory, description, prompt: data.prompt };
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

      if (!isPro && newStats.total >= FREE_PROMPTS_LIMIT - 2) {
        showToast(`Solo te quedan ${FREE_PROMPTS_LIMIT - newStats.total} prompts gratuitos`, 'info');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar el prompt. Por favor intenta de nuevo.');
      showToast('Error al generar el prompt', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => currentDescription && handleSubmit(currentDescription);

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
    <main className="min-h-screen relative">
      <div ref={bgRef} className="antigravity-bg">
        <div 
          className="antigravity-layer layer-1"
          style={{ transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)` }}
        />
        <div 
          className="antigravity-layer layer-2"
          style={{ transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)` }}
        />
        <div className="antigravity-layer layer-3" />
        <div className="grid-overlay" />
        <div 
          className="floating-particle particle-1 animate-float"
          style={{ transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px)` }}
        />
        <div 
          className="floating-particle particle-2 animate-float-delayed"
          style={{ transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)` }}
        />
        <div 
          className="floating-particle particle-3 animate-float"
          style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)` }}
        />
        <div 
          className="floating-particle particle-4 animate-float-delayed"
          style={{ transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)` }}
        />
        <div className="hero-glow" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} />}
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 animate-fade-in-up" role="alert">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex gap-2 items-start">
            {user && (
              <div className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 animate-fade-in-up">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-medium">{user.name}</p>
                  <p className="text-cyan-400 text-[10px]">{user.plan === 'pro' ? 'PRO' : 'Gratis'}</p>
                </div>
                <button onClick={handleLogout} className="ml-1 text-gray-400 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
            
            {!isPro && stats.total > 0 && (
              <button
                onClick={() => setShowAuth(true)}
                className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 animate-fade-in-up"
              >
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/10" />
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" 
                      strokeDasharray={88}
                      strokeDashoffset={88 * (1 - remainingFree / FREE_PROMPTS_LIMIT)}
                      className="text-cyan-400 usage-ring"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{remainingFree}</span>
                </div>
              </button>
            )}
            
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="glass-card p-2 hover:scale-110 transition-all header-btn"
            >
              <span className="text-lg">⭐</span>
            </button>
            <button
              onClick={handleThemeToggle}
              className="glass-card p-2 hover:scale-110 transition-all header-btn"
            >
              <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="glass-card p-2 hover:scale-110 transition-all header-btn"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>

          <div className="pt-16 md:pt-8">
            <div className="logo-container mb-4">
              <div className="logo-glow" />
              <img src="/logo.png" alt="PromptLab" className="logo-img h-24 mx-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 animate-fade-in-up">
              <span className="gradient-text">Prompt</span>Lab
            </h1>
            <p className="text-gray-400 animate-fade-in-up stagger-1">Genera prompts profesionales para IA</p>
            <div className="flex items-center justify-center gap-4 mt-4 animate-fade-in-up stagger-2">
              <span className="text-sm text-gray-500">📊 {stats.total} generados</span>
              {isPro && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                  PRO
                </span>
              )}
            </div>
          </div>
        </header>

        {generatedPrompt ? (
          <div className="space-y-6 prompt-result-enter">
            <button
              onClick={handleNewGeneration}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Nueva generación
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
            <section className="animate-fade-in-up stagger-1">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Selecciona una categoría
              </h2>
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </section>

            {selectedCategory && (
              <section className="animate-fade-in-up stagger-2">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  {getCategoryById(selectedCategory)?.icon} {getCategoryById(selectedCategory)?.name}
                </h2>
                <PromptForm
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  disabled={!selectedCategory || isLimitReached}
                />
              </section>
            )}

            {history.length > 0 && !selectedCategory && (
              <section className="animate-fade-in-up stagger-3">
                <History history={history} onSelect={handleHistorySelect} />
              </section>
            )}

            {!user && !isLimitReached && stats.total >= 3 && (
              <div className="glass-card rounded-xl p-6 text-center animate-fade-in-up stagger-4">
                <p className="text-gray-400 mb-3">¿Te queda poco? Continúa sin límites</p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold hover:scale-105 transition-transform"
                >
                  Mejorar a PRO
                </button>
              </div>
            )}
          </div>
        )}

        {showFavorites && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 login-blur" onClick={() => setShowFavorites(false)}>
            <div className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in-scale" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>⭐</span> Favoritos
                </h2>
                <button onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              {favorites.length === 0 ? (
                <p className="text-gray-400">No hay favoritos guardados</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { handleHistorySelect(item); setShowFavorites(false); }}
                      className="w-full p-3 glass-card rounded-lg text-left hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">{item.category}</span>
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 login-blur" onClick={() => setShowSettings(false)}>
            <div className="glass rounded-2xl p-6 max-w-lg w-full animate-fade-in-scale" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>⚙️</span> Configuración
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tu API Key de Groq</label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none input-glow"
                  />
                </div>
                <button
                  onClick={handleSaveApiKey}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-transform"
                >
                  Guardar
                </button>
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm text-gray-400 mb-2">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 glass-card rounded-lg text-center">
                      <div className="text-2xl font-bold gradient-text">{stats.total}</div>
                      <div className="text-xs text-gray-400">Generados</div>
                    </div>
                    <div className="p-3 glass-card rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.favorites}</div>
                      <div className="text-xs text-gray-400">Favoritos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onLogin={handleLogin}
        isLimitReached={isLimitReached}
        remainingFree={remainingFree}
      />

      {showWelcome && user && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right">
          <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <p className="text-white font-medium">¡Bienvenido{user.plan === 'pro' ? ', PRO!' : '!'}</p>
              <p className="text-gray-400 text-sm">{user.name}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
