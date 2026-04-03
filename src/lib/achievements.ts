export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'prompts' | 'favorites' | 'streak' | 'days';
  unlockedAt?: number;
}

export const achievements: Achievement[] = [
  { id: 'first-prompt', name: 'Primeros pasos', description: 'Genera tu primer prompt', icon: '🌟', requirement: 1, type: 'prompts' },
  { id: '10-prompts', name: 'En marcha', description: 'Genera 10 prompts', icon: '🚀', requirement: 10, type: 'prompts' },
  { id: '25-prompts', name: 'Productor', description: 'Genera 25 prompts', icon: '⚡', requirement: 25, type: 'prompts' },
  { id: '50-prompts', name: 'Maestro', description: 'Genera 50 prompts', icon: '👑', requirement: 50, type: 'prompts' },
  { id: '100-prompts', name: 'Leyenda', description: 'Genera 100 prompts', icon: '🏆', requirement: 100, type: 'prompts' },
  { id: 'first-favorite', name: 'Coleccionista', description: 'Guarda tu primer favorito', icon: '💫', requirement: 1, type: 'favorites' },
  { id: '5-favorites', name: 'Curador', description: 'Guarda 5 favoritos', icon: '📚', requirement: 5, type: 'favorites' },
  { id: '10-favorites', name: 'Bibliotecario', description: 'Guarda 10 favoritos', icon: '🏛️', requirement: 10, type: 'favorites' },
  { id: '3-streak', name: 'Consistente', description: '3 días consecutivos', icon: '🔥', requirement: 3, type: 'streak' },
  { id: '7-streak', name: 'Dedicado', description: '7 días consecutivos', icon: '💪', requirement: 7, type: 'streak' },
  { id: '30-streak', name: 'Adict@', description: '30 días consecutivos', icon: '🎯', requirement: 30, type: 'streak' },
  { id: '7-days', name: 'Semanal', description: 'Usa la app por 7 días', icon: '📅', requirement: 7, type: 'days' },
  { id: '30-days', name: 'Mensual', description: 'Usa la app por 30 días', icon: '🗓️', requirement: 30, type: 'days' },
];

export function checkAchievements(stats: { total: number; favorites: number; streak?: number; firstUsed?: number }): Achievement[] {
  const daysUsed = stats.firstUsed ? Math.floor((Date.now() - stats.firstUsed) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const streak = stats.streak || 0;
  
  return achievements.filter(a => {
    switch (a.type) {
      case 'prompts':
        return stats.total >= a.requirement;
      case 'favorites':
        return stats.favorites >= a.requirement;
      case 'streak':
        return streak >= a.requirement;
      case 'days':
        return daysUsed >= a.requirement;
      default:
        return false;
    }
  });
}

export function getUnlockedAchievements(achievements: Achievement[], unlockedIds: string[]): Achievement[] {
  return achievements.filter(a => unlockedIds.includes(a.id));
}