import { useState, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'default' | 'success' | 'gold' | 'info' | 'warn' | 'danger';
}

let addToast: ((msg: string, type?: Toast['type']) => void) | null = null;

export function showToast(message: string, type: Toast['type'] = 'default') {
  if (addToast) addToast(message, type);
}

export default function ToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (message, type = 'default') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    };
    return () => {
      addToast = null;
    };
  }, []);

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
