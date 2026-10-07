import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Kind = 'success' | 'error';
interface Toast {
  id: number;
  kind: Kind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: Kind) => void>(
  () => {},
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4000,
    );
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
