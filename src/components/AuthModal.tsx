'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { name: string; email: string; plan: 'free' | 'pro'; id?: string; demoExpiresAt?: number }) => void;
  isLimitReached: boolean;
  remainingFree: number;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; gradient: string } {
  let score = 0;
  
  if (password.length >= 8 && password.length <= 22) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 1) return { score, label: 'Muy débil', color: '#ef4444', gradient: 'from-red-500 to-red-600' };
  if (score <= 2) return { score, label: 'Débil', color: '#f97316', gradient: 'from-orange-500 to-orange-600' };
  if (score <= 3) return { score, label: 'Regular', color: '#eab308', gradient: 'from-yellow-500 to-yellow-600' };
  if (score <= 4) return { score, label: 'Buena', color: '#22c55e', gradient: 'from-green-500 to-green-600' };
  return { score, label: 'Excelente', color: '#10b981', gradient: 'from-emerald-500 to-cyan-500' };
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (password.length > 22) {
    errors.push('Máximo 22 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos 1 mayúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos 1 número');
  }
  
  return { valid: errors.length === 0, errors };
}

export default function AuthModal({ isOpen, onClose, onLogin, isLimitReached, remainingFree }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  const passwordStrength = mode === 'register' ? getPasswordStrength(password) : null;
  const passwordValidation = mode === 'register' ? validatePassword(password) : { valid: true, errors: [] };
  const passwordsMatch = mode === 'register' ? password === confirmPassword : true;

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        onLogin({
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario',
          email: data.user.email || '',
          plan: 'pro',
          id: data.user.id,
        });
        onClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!passwordValidation.valid) {
      setError('La contraseña no cumple los requisitos');
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        onLogin({
          name: name || email.split('@')[0],
          email,
          plan: 'pro',
          id: data.user.id,
        });
        onClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrarse';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    onLogin({ name: 'Invitado', email: 'guest@promptlab.app', plan: 'free' });
    onClose();
  };

  const handleDemo = (plan: 'free' | 'pro') => {
    setIsLoading(true);
    
    if (plan === 'pro') {
      const demoExpiration = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('promptlab_demo_expires', demoExpiration.toString());
      
      setTimeout(() => {
        onLogin({
          name: 'Usuario Demo PRO',
          email: 'demo@promptlab.app',
          plan: 'pro',
          demoExpiresAt: demoExpiration
        });
        setIsLoading(false);
        onClose();
      }, 800);
    } else {
      setTimeout(() => {
        onLogin({
          name: 'Usuario Demo',
          email: 'demo-free@promptlab.app',
          plan: 'free'
        });
        setIsLoading(false);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md animate-fade-in-scale">
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/20 rounded-full animate-pulse-glow" />
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 mb-4 animate-breathe">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isLimitReached ? 'Límite alcanzado' : mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p className="text-gray-400 mt-2">
              {isLimitReached 
                ? `Has usado tus ${remainingFree} prompts gratuitos` 
                : mode === 'login' 
                  ? 'Inicia sesión para continuar' 
                  : 'Regístrate para obtener más funcionalidades'}
            </p>
          </div>

          {isLimitReached && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-amber-400 font-medium">¡Ups! Has alcanzado el límite</p>
                  <p className="text-gray-400 text-sm">Inicia sesión o regístrate para continuar generando prompts sin límites</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleDemo('free')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all social-btn hover:animate-breathe hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Continuar como Invitado
            </button>
            
            <button
              onClick={() => handleDemo('pro')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Probar versión PRO
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#111118] text-gray-500">o crea una cuenta</span>
            </div>
          </div>

          <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
            {mode === 'register' && (
              <div>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:bg-white/10 transition-all outline-none"
                />
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:bg-white/10 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 22))}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  mode === 'register' && password 
                    ? passwordStrength?.score && passwordStrength.score >= 3 
                      ? 'border-green-500 focus:border-green-400' 
                      : 'border-orange-500/50 focus:border-orange-400'
                    : 'border-white/10 focus:border-cyan-400 focus:bg-white/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {mode === 'register' && password && (
              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Seguridad de contraseña</span>
                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10"
                    style={{ color: passwordStrength?.color }}
                  >
                    {passwordStrength?.label}
                  </span>
                </div>
                
                <div className="relative h-4 bg-white/10 rounded-lg overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${passwordStrength?.gradient} transition-all duration-700 ease-out`}
                    style={{ width: `${((passwordStrength?.score || 0) / 5) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((level, idx) => (
                      <div 
                        key={level}
                        className={`w-8 h-2 rounded transition-all duration-500 ${
                          (passwordStrength?.score || 0) >= level 
                            ? passwordStrength?.gradient 
                            : 'bg-white/20'
                        }`}
                        style={{
                          transform: (passwordStrength?.score || 0) >= level ? 'scaleY(1.2)' : 'scaleY(1)',
                          animationDelay: `${idx * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{password.length}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${passwordStrength?.gradient} transition-all duration-300`}
                      style={{ width: `${Math.min(100, (password.length / 22) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-500">22</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: '8-22 caracteres', valid: password.length >= 8 && password.length <= 22 },
                    { label: 'Mayúscula', valid: /[A-Z]/.test(password) },
                    { label: 'Número', valid: /[0-9]/.test(password) },
                    { label: '12+ caracteres', valid: password.length >= 12 },
                  ].map((req, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-1.5 text-xs py-1 px-2 rounded-md transition-all duration-300 ${
                        req.valid 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-white/5 text-gray-500'
                      }`}
                    >
                      <span className={`transition-transform duration-300 ${req.valid ? 'scale-110' : ''}`}>
                        {req.valid ? '✓' : '○'}
                      </span>
                      <span className="font-medium">{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.slice(0, 22))}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                    confirmPassword 
                      ? passwordsMatch 
                        ? 'border-green-500 focus:border-green-400' 
                        : 'border-red-500/50 focus:border-red-400'
                      : 'border-white/10 focus:border-cyan-400 focus:bg-white/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {mode === 'register' && confirmPassword && !passwordsMatch && (
              <p className="text-red-400 text-xs">Las contraseñas no coinciden</p>
            )}

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && (!passwordValidation.valid || !passwordsMatch))}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </>
              ) : mode === 'login' ? (
                'Iniciar sesión'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
            >
              {mode === 'login' 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}