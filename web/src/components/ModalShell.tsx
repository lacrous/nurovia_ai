import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Title-bar icon to render before the title text. */
  icon?: ReactNode;
  /** Width class for the inner panel. Default `max-w-3xl`. */
  widthClass?: string;
  /** Vertical alignment of the panel. Default `pt-[8vh]`. */
  topClass?: string;
  /** Max height of the inner panel. Default `max-h-[84vh]`. */
  maxHeightClass?: string;
  children: ReactNode;
}

/**
 * Backdrop fades, content slides + scales on entrance and exit.
 * Use this for every full-screen modal so animations stay consistent.
 */
export function ModalShell({
  open,
  onClose,
  title,
  icon,
  widthClass = "max-w-3xl",
  topClass = "pt-[8vh]",
  maxHeightClass = "max-h-[84vh]",
  children,
}: ModalShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full ${widthClass} ${topClass} bg-panel border border-theme/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${maxHeightClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {title !== undefined && (
              <div className="p-4 border-b border-theme/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {icon}
                  <h2 className="text-[15px] font-semibold truncate">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}