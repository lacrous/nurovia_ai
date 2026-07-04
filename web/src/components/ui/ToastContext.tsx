import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, opts?: Partial<Omit<Toast, "id" | "message" | "type">>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", opts: Partial<Omit<Toast, "id" | "message" | "type">> = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = opts.duration ?? 4000;
      setToasts((prev) => [...prev, { id, message, type, ...opts }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return useMemo(
    () => ({
      info: (message: string, opts?: Partial<Omit<Toast, "id" | "message" | "type">>) => ctx.addToast(message, "info", opts),
      success: (message: string, opts?: Partial<Omit<Toast, "id" | "message" | "type">>) => ctx.addToast(message, "success", opts),
      warning: (message: string, opts?: Partial<Omit<Toast, "id" | "message" | "type">>) => ctx.addToast(message, "warning", opts),
      error: (message: string, opts?: Partial<Omit<Toast, "id" | "message" | "type">>) => ctx.addToast(message, "error", opts),
      withAction: (opts: { message: string; actionLabel: string; onAction: () => void; duration?: number; type?: ToastType }) =>
        ctx.addToast(opts.message, opts.type ?? "info", {
          actionLabel: opts.actionLabel,
          onAction: opts.onAction,
          duration: opts.duration ?? 6000,
        }),
      addToast: ctx.addToast,
      removeToast: ctx.removeToast,
    }),
    [ctx]
  );
}