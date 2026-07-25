'use client';

import { useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const colors = {
  success: { bg: 'rgba(34,197,94,0.1)',  border: '#22c55e', text: '#22c55e',  dot: '#22c55e' },
  error:   { bg: 'rgba(239,68,68,0.1)',   border: '#ef4444', text: '#ef4444',  dot: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.1)',  border: '#f59e0b', text: '#f59e0b',  dot: '#f59e0b' },
  info:    { bg: 'rgba(56,189,248,0.1)',  border: '#38bdf8', text: '#38bdf8',  dot: '#38bdf8' },
};

export function Toast({ message, type, onClose }: ToastProps) {
  const c = colors[type];
  return (
    <div className="toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
      style={{ background: '#111113', border: `1px solid ${c.border}`, minWidth: 280, maxWidth: 380 }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      <span className="text-sm font-medium flex-1" style={{ color: '#fafafa' }}>{message}</span>
      <button onClick={onClose} className="text-xs" style={{ color: '#52525b' }}>✕</button>
    </div>
  );
}

/* ── Toast Container (fixed bottom-right) ─────────────── */
export function ToastContainer({ toasts }: { toasts: { id: string; message: string; type: 'success'|'error'|'warning'|'info' }[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type} onClose={() => {}} />
        </div>
      ))}
    </div>
  );
}

/* ── useToast hook ────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success'|'error'|'warning'|'info' }[]>([]);

  const addToast = (message: string, type: 'success'|'error'|'warning'|'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return { toasts, addToast };
}
