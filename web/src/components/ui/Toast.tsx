import { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Undo2 } from "lucide-react";
import { ToastContext } from "./ToastContext";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  error: "bg-red-500/10 border-red-500/20 text-red-500",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
};

export function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-max max-w-[90vw]">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm ${styles[toast.type]}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[12px] font-medium text-foreground">{toast.message}</span>
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-foreground hover:bg-foreground/10 transition-colors"
                >
                  <Undo2 className="w-3 h-3" />
                  {toast.actionLabel}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-1 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}