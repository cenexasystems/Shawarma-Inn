import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastMessage[];
  dismiss: (id: string) => void;
}) {
  const colorClasses: Record<ToastType, string> = {
    success: 'border-green-500/40 bg-green-500/15 text-green-200',
    error: 'border-red-500/40 bg-red-500/15 text-red-200',
    warning: 'border-orange-500/40 bg-orange-500/15 text-orange-200',
    info: 'border-blue-500/40 bg-blue-500/15 text-blue-200',
  };

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 w-[min(360px,90vw)] pointer-events-none">
      {toasts.slice(0, 4).map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto border rounded-xl px-3 py-2 shadow-xl transition-all duration-300 ${colorClasses[toast.type]} ${toast.exiting ? 'translate-x-8 opacity-0' : 'translate-x-0 opacity-100'}`}
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-xs font-bold">
              {icons[toast.type]}
            </span>
            <p className="text-sm leading-tight flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-xs text-white/60 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 260);
  };

  const show = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [{ id, type, message }, ...prev]);
    window.setTimeout(() => dismiss(id), 3000);
  };

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message: string) => show('success', message),
      showError: (message: string) => show('error', message),
      showWarning: (message: string) => show('warning', message),
      showInfo: (message: string) => show('info', message),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
