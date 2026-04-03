'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

function throttle<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}
import { createClient } from '@/lib/supabase/client';
import { categories, getCategoryById } from '@/lib/prompts';
import { achievements, checkAchievements } from '@/lib/achievements';
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
  id?: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  demoExpiresAt?: number;
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
  const [stats, setStats] = useState({ total: 0, favorites: 0, streak: 0, firstUsed: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'api' | 'profile' | 'stats' | 'achievements'>('api');
  const [showAchievements, setShowAchievements] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [customApiKey, setCustomApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'groq' | 'openai' | 'anthropic'>('groq');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mouseTrail, setMouseTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const trailIdRef = useRef(0);
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      setIsHydrated(true);
      
      // Handle shared prompt from URL
      const urlParams = new URLSearchParams(window.location.search);
      const shareParam = urlParams.get('share');
      if (shareParam) {
        try {
          const decoded = decodeURIComponent(atob(shareParam));
          setSharedPrompt(decoded);
        } catch (e) {
          console.error('Invalid share link');
        }
      }
      
      // Load saved provider
      const savedProvider = localStorage.getItem('promptlab_provider');
      if (savedProvider) setAiProvider(savedProvider as 'groq' | 'openai' | 'anthropic');
      
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          plan: 'pro',
        });
        localStorage.setItem(USER_KEY, JSON.stringify({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          plan: 'pro',
        }));
      } else {
        const savedUser = localStorage.getItem(USER_KEY);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.demoExpiresAt && Date.now() > parsedUser.demoExpiresAt) {
            const expiredUser = { ...parsedUser, plan: 'free' as const, demoExpiresAt: undefined };
            localStorage.setItem(USER_KEY, JSON.stringify(expiredUser));
            setUser(expiredUser);
          } else {
            setUser(parsedUser);
          }
        }
      }

      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
      const savedStats = localStorage.getItem(STATS_KEY);
      let parsedStats = savedStats ? JSON.parse(savedStats) : { total: 0, favorites: 0, streak: 0, firstUsed: 0, lastActiveDate: 0 };
      
      // Calculate streak
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastActive = parsedStats.lastActiveDate || 0;
      const yesterday = today - 86400000;
      
      if (lastActive < yesterday && lastActive !== today) {
        parsedStats.streak = 0;
      }
      
      if (!parsedStats.firstUsed) {
        parsedStats.firstUsed = today;
        parsedStats.lastActiveDate = today;
      } else if (lastActive !== today) {
        if (lastActive === yesterday) {
          parsedStats.streak += 1;
        } else {
          parsedStats.streak = 1;
        }
        parsedStats.lastActiveDate = today;
      }
      
      setStats(parsedStats);
      localStorage.setItem(STATS_KEY, JSON.stringify(parsedStats));
      setCustomApiKey(localStorage.getItem('promptlab_custom_api_key') || '');
      const savedTheme = localStorage.getItem('promptlab_theme');
      setTheme((savedTheme as 'dark' | 'light') || 'dark');
      const savedAchievements = JSON.parse(localStorage.getItem('promptlab_achievements') || '[]');
      setUnlockedAchievements(savedAchievements);
    };

    initAuth();

    // Show onboarding for first-time users
    const hasSeenOnboarding = localStorage.getItem('promptlab_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          name: String(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario'),
          email: session.user.email || '',
          plan: 'pro',
        };
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isPro = user?.plan === 'pro';

  const effectiveIsPro = user?.plan === 'pro' && (!user?.demoExpiresAt || Date.now() < user.demoExpiresAt);
  const remainingFree = Math.max(0, FREE_PROMPTS_LIMIT - stats.total);
  const isLimitReached = !effectiveIsPro && stats.total >= FREE_PROMPTS_LIMIT;

  const handleMouseMove = useMemo(
    () => throttle((e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
      
      if (Math.random() > 0.7) {
        const newParticle = {
          id: trailIdRef.current++,
          x: e.clientX,
          y: e.clientY,
        };
        setMouseTrail(prev => [...prev.slice(-20), newParticle]);
      }
    }, 16),
    []
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mouseTrail.length > 0) {
        setMouseTrail(prev => prev.slice(1));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [mouseTrail.length]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

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

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      showToast('El nombre no puede estar vacío', 'error');
      return;
    }
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileForm.name }
      });
      
      if (error) throw error;
      
      const updatedUser = { ...user, name: profileForm.name };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setEditingProfile(false);
      showToast('Perfil actualizado correctamente', 'success');
    } catch (err) {
      showToast('Error al actualizar el perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const passwordValidation = validatePassword(profileForm.newPassword);
    if (!passwordValidation.valid) {
      showToast('La contraseña no cumple los requisitos', 'error');
      return;
    }
    if (profileForm.newPassword !== profileForm.confirmNewPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (!profileForm.currentPassword) {
      showToast('Ingresa tu contraseña actual', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: profileForm.newPassword
      });
      
      if (error) throw error;
      
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmNewPassword: '' });
      showToast('Contraseña actualizada correctamente', 'success');
    } catch (err) {
      showToast('Error al cambiar la contraseña', 'error');
    } finally {
      setIsLoading(false);
    }
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
    
    // Check achievements for favorites
    const favAchievements = checkAchievements(newStats).map(a => a.id);
    const newlyUnlocked = favAchievements.filter(id => !unlockedAchievements.includes(id));
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newlyUnlocked];
      setUnlockedAchievements(updatedAchievements);
      localStorage.setItem('promptlab_achievements', JSON.stringify(updatedAchievements));
    }
    showToast(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', 'success');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('promptlab_theme', newTheme);
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('promptlab_custom_api_key', customApiKey.trim());
      localStorage.setItem('promptlab_provider', aiProvider);
      showToast('API guardada correctamente', 'success');
      setShowSettings(false);
    }
  };

  const handleSaveProvider = (provider: 'groq' | 'openai' | 'anthropic') => {
    setAiProvider(provider);
    localStorage.setItem('promptlab_provider', provider);
  };

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (password.length > 22) errors.push('Máximo 22 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Al menos 1 mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Al menos 1 número');
    return { valid: errors.length === 0, errors };
  };

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    showToast(`Bienvenido${loggedUser.plan === 'pro' ? ', versión PRO activada!' : '!'}`, 'success');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(USER_KEY);
    showToast('Sesión cerrada', 'info');
  };

  const handleSubmit = async (description: string, promptId?: string) => {
    if (!selectedCategory) return;
    if (isLimitReached && !effectiveIsPro) {
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
        body: JSON.stringify({ category: selectedCategory, description, apiKey: customApiKey, provider: aiProvider }),
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
      
      // Check for new achievements
      const newAchievements = checkAchievements(newStats).map(a => a.id);
      const newlyUnlocked = newAchievements.filter(id => !unlockedAchievements.includes(id));
      if (newlyUnlocked.length > 0) {
        const updatedAchievements = [...unlockedAchievements, ...newlyUnlocked];
        setUnlockedAchievements(updatedAchievements);
        localStorage.setItem('promptlab_achievements', JSON.stringify(updatedAchievements));
        newlyUnlocked.forEach(id => {
          const achievement = achievements.find(a => a.id === id);
          if (achievement) showToast(`🏆 ¡Desbloqueaste: ${achievement.name}!`, 'success');
        });
      }

      // Guardar en Supabase si el usuario está logueado
      if (user?.id) {
        await supabase.from('prompts').insert({
          user_id: user.id,
          category: selectedCategory,
          description,
          prompt: data.prompt,
        });
      }

      if (!effectiveIsPro && newStats.total >= FREE_PROMPTS_LIMIT - 2) {
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

  const handleRegenerate = () => currentDescription && handleSubmit(currentDescription, currentPromptId || undefined);

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
    setSharedPrompt(null);
    setCurrentDescription('');
    setCurrentPromptId(null);
    setIsFavorite(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleExportJson = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptlab-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Historial exportado como JSON', 'success');
  };

  const handleExportPdf = () => {
    const content = history.map(h => 
      `## ${h.category.toUpperCase()} - ${new Date(h.timestamp).toLocaleDateString('es-ES')}\n\n**Descripción:** ${h.description}\n\n**Prompt:**\n${h.prompt}\n\n---\n`
    ).join('\n');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Permite ventanas emergentes', 'error');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Historial - PromptLab</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; white-space: pre-wrap; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h2 { color: #333; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; }
            .description { color: #666; font-style: italic; }
            .prompt { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 10px; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 30px 0; }
          </style>
        </head>
        <body>
          <h1>📜 Historial de PromptLab</h1>
          <p>Exportado el ${new Date().toLocaleDateString('es-ES')}</p>
          <hr/>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showToast('Historial exportado como PDF', 'success');
  };

  const handleExportFavorites = () => {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptlab-favorites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Favoritos exportados', 'success');
  };

  return (
    <main className="min-h-screen relative">
      <div ref={bgRef} className="bg-container">
        <div 
          className="bg-glow bg-glow-1"
          style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)` }}
        />
        <div 
          className="bg-glow bg-glow-2"
          style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)` }}
        />
        <div 
          className="bg-glow bg-glow-3"
          style={{ transform: `translate(calc(-50% + ${mousePosition.x * 10}px), calc(-50% + ${mousePosition.y * 10}px))` }}
        />
        <div className="bg-grid" />
        {mouseTrail.map((particle) => (
          <div
            key={particle.id}
            className="bg-trail"
            style={{
              left: particle.x - 3,
              top: particle.y - 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} />}
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 animate-fade-in-up" role="alert">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <header className="text-center mb-8 relative">
          <div className="fixed top-4 right-4 flex gap-2 items-start z-40">
            {isHydrated && user && (
              <div className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 animate-fade-in-up">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-medium">{user.name}</p>
                  <p className="text-cyan-400 text-[10px]">{user.plan === 'pro' ? (user.demoExpiresAt ? 'DEMO' : 'PRO') : 'Gratis'}</p>
                  {user.demoExpiresAt && (
                    <p className="text-orange-400 text-[10px]">
                      ⏱️ {Math.max(0, Math.floor((user.demoExpiresAt - Date.now()) / (1000 * 60 * 60)))}h restantes
                    </p>
                  )}
                </div>
                <button onClick={handleLogout} className="ml-1 text-gray-400 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
            
            {isHydrated && !effectiveIsPro && stats.total > 0 && (
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
              className="glass-card p-2 hover:scale-110 transition-all header-btn hover:animate-bounce group relative"
              title="Ver favoritos"
            >
              <span className="text-lg">⭐</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Ver favoritos
              </span>
            </button>
            <button
              onClick={handleThemeToggle}
              className="glass-card p-2 hover:scale-110 transition-all header-btn hover:animate-spin-slow group relative"
              title="Cambiar tema"
            >
              <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="glass-card p-2 hover:scale-110 transition-all header-btn hover:animate-breathe group relative"
              title="Configuración"
            >
              <span className="text-lg">⚙️</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Configuración
              </span>
            </button>
          </div>

          <div className="pt-16 md:pt-8">
            <div className="logo-container mb-4">
              <div className="logo-glow animate-pulse-glow" />
              <img src="/logo.png" alt="PromptLab" className="logo-img h-24 mx-auto animate-float-gentle" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 animate-fade-in-up">
              <span className="gradient-text animate-gradient-shift bg-[length:200%_auto] bg-clip-text text-transparent">Prompt</span>Lab
            </h1>
            <p className="text-gray-400 animate-fade-in-up stagger-1">Genera prompts profesionales para IA</p>
            <div className="flex items-center justify-center gap-4 mt-4 animate-fade-in-up stagger-2">
              <span className="text-sm text-gray-500 animate-pulse">📊 {stats.total} generados</span>
              {stats.streak > 0 && (
                <span className="text-sm text-orange-500 animate-pulse">🔥 {stats.streak} días</span>
              )}
              {effectiveIsPro && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white animate-breathe">
                  {user?.demoExpiresAt ? 'DEMO' : 'PRO'}
                </span>
              )}
            </div>
          </div>
        </header>

        {generatedPrompt || sharedPrompt ? (
          <div className="space-y-6 prompt-result-enter">
            <button
              onClick={handleNewGeneration}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Nueva generación
            </button>
            <PromptResult
              prompt={generatedPrompt || sharedPrompt || ''}
              onRegenerate={handleRegenerate}
              isLoading={isLoading}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onError={(msg) => showToast(msg, 'error')}
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
                <History 
              history={history} 
              onSelect={handleHistorySelect}
              showExport
              onExportJson={handleExportJson}
              onExportPdf={handleExportPdf}
            />
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
                  <span>⭐</span> Favoritos ({favorites.length})
                </h2>
                <button onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              {favorites.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleExportFavorites}
                    className="flex-1 py-2 text-sm glass-card rounded-lg hover:scale-105 transition-all"
                  >
                    📥 Exportar
                  </button>
                </div>
              )}
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 login-blur" onClick={() => { setShowSettings(false); setEditingProfile(false); }}>
            <div className="glass rounded-2xl p-6 max-w-lg w-full animate-fade-in-scale" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>⚙️</span> Configuración
                </h2>
                <button onClick={() => { setShowSettings(false); setEditingProfile(false); }} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSettingsTab('api')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${settingsTab === 'api' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  🔑 API
                </button>
                <button
                  onClick={() => { setSettingsTab('profile'); setProfileForm({ name: user?.name || '', email: user?.email || '', currentPassword: '', newPassword: '', confirmNewPassword: '' }); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${settingsTab === 'profile' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  👤 Perfil
                </button>
                <button
                  onClick={() => setSettingsTab('stats')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${settingsTab === 'stats' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setSettingsTab('achievements')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${settingsTab === 'achievements' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  🏆 Logros{unlockedAchievements.length > 0 && ` (${unlockedAchievements.length})`}
                </button>
              </div>

              {settingsTab === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Proveedor de IA</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProvider('groq')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          aiProvider === 'groq' 
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>⚡</span> Groq
                      </button>
                      <button
                        onClick={() => handleSaveProvider('openai')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          aiProvider === 'openai' 
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>🔵</span> OpenAI
                      </button>
                      <button
                        onClick={() => handleSaveProvider('anthropic')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          aiProvider === 'anthropic' 
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>🟤</span> Anthropic
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      API Key de {aiProvider === 'groq' ? 'Groq' : aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'}
                    </label>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder={aiProvider === 'groq' ? 'gsk_...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none input-glow"
                    />
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-transform"
                  >
                    Guardar
                  </button>
                </div>
              )}

              {settingsTab === 'profile' && user && !user.demoExpiresAt && (
                <div className="space-y-4">
                  {!editingProfile ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 glass-card rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="w-full py-3 bg-white/10 border border-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                      >
                        Editar perfil
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nombre</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Correo electrónico</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          disabled
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <button
                        onClick={handleUpdateProfile}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-transform"
                      >
                        Guardar cambios
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="w-full py-2 text-gray-400 text-sm hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm text-gray-400 mb-3">Cambiar contraseña</h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Contraseña actual"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value.slice(0, 22) })}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={profileForm.confirmNewPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmNewPassword: e.target.value.slice(0, 22) })}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading}
                        className="w-full py-3 bg-white/10 border border-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                      >
                        Cambiar contraseña
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'profile' && user?.demoExpiresAt && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Esta opción no está disponible para usuarios demo</p>
                </div>
              )}

              {settingsTab === 'stats' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 glass-card rounded-xl text-center">
                    <div className="text-3xl font-bold gradient-text">{stats.total}</div>
                    <div className="text-sm text-gray-400 mt-1">Prompts generados</div>
                  </div>
                  <div className="p-4 glass-card rounded-xl text-center">
                    <div className="text-3xl font-bold text-yellow-400">{favorites.length}</div>
                    <div className="text-sm text-gray-400 mt-1">Favoritos</div>
                  </div>
                </div>
              )}

              {settingsTab === 'achievements' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-400 mb-3">
                    {unlockedAchievements.length} / {achievements.length} logros desbloqueados
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {achievements.map((achievement) => {
                      const unlocked = unlockedAchievements.includes(achievement.id);
                      return (
                        <div
                          key={achievement.id}
                          className={`p-3 rounded-lg text-center transition-all ${
                            unlocked 
                              ? 'bg-yellow-500/20 border border-yellow-500/50' 
                              : 'bg-white/5 opacity-50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{achievement.icon}</div>
                          <div className={`text-xs font-medium ${unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {achievement.name}
                          </div>
                          <div className="text-[10px] text-gray-500">{achievement.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

      {isHydrated && showWelcome && user && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right">
          <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <p className="text-white font-medium">¡Bienvenido{user.plan === 'pro' ? (user.demoExpiresAt ? ', DEMO!' : ', PRO!') : '!'}</p>
              <p className="text-gray-400 text-sm">{user.name}</p>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-fade-in-scale">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {onboardingStep === 0 && '¡Bienvenido a PromptLab!'}
                {onboardingStep === 1 && 'Selecciona una categoría'}
                {onboardingStep === 2 && 'Describe tu prompt'}
                {onboardingStep === 3 && '¡Listo!'}
              </h2>
            </div>
            
            <div className="space-y-4 mb-6">
              {onboardingStep === 0 && (
                <p className="text-gray-400 text-center">
                  Transforma tus ideas en prompts profesionales para cualquier IA. 
                  Elige una categoría y describe lo que necesitas.
                </p>
              )}
              {onboardingStep === 1 && (
                <p className="text-gray-400 text-center">
                  Tienes 5 secciones: Profesional, Creativo, Técnico, Personal y Salud.
                  Cada una tiene múltiples categorías especializadas.
                </p>
              )}
              {onboardingStep === 2 && (
                <p className="text-gray-400 text-center">
                  Escribe una descripción clara de lo que necesitas. 
                  Mientras más específico, mejor será el resultado.
                  Usa <span className="text-cyan-400">Ctrl + Enter</span> para generar más rápido.
                </p>
              )}
              {onboardingStep === 3 && (
                <p className="text-gray-400 text-center">
                  ¡Ya puedes empezar! Tienes 10 prompts gratuitos. 
                  Inicia sesión o prueba el Demo PRO por 24 horas.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {onboardingStep > 0 && (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  ← Atrás
                </button>
              )}
              {onboardingStep < 3 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('promptlab_onboarding_seen', 'true');
                    setShowOnboarding(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
                >
                  ¡Empezar! 🎉
                </button>
              )}
            </div>

            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === onboardingStep 
                      ? 'bg-cyan-400 w-4' 
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center z-30">
        <p className="text-xs text-gray-500">© 2026 Masta Dev. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
