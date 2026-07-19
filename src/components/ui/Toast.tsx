import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

const config: Record<ToastType, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-brand-200', iconColor: 'text-brand-600' },
  error: { icon: XCircle, ring: 'ring-red-200', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'ring-blue-200', iconColor: 'text-blue-600' },
  warning: { icon: AlertTriangle, ring: 'ring-amber-200', iconColor: 'text-amber-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm">
        {toasts.map((t) => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 rounded-2xl bg-white shadow-card ring-1 px-4 py-3.5 animate-scale-in',
                c.ring,
              )}
            >
              <Icon size={20} className={cn('mt-0.5 shrink-0', c.iconColor)} />
              <p className="text-sm font-medium text-ink-900 flex-1">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-700">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
