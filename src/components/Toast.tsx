'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Toast({ message, type }: ToastProps) {
  const bgColor = {
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl border ${bgColor} transition-all duration-300 translate-y-0 opacity-100`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
