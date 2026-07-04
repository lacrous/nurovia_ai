import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type ProviderInfo, type ProviderKeyPublic } from "../../services/api";
import { AdvancedProviderCard } from "./AdvancedProviderCard";
import { ProviderLogo } from "./providerLogos";

interface ProviderDetailSheetProps {
  provider: ProviderInfo | null;
  storedKey?: ProviderKeyPublic;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

/**
 * Right-side panel that hosts the full AdvancedProviderCard.
 * Slides in when the user clicks a provider icon.
 */
export function ProviderDetailSheet({ provider, storedKey, onClose, onSaved }: ProviderDetailSheetProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!provider) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [provider]);

  // Escape to close
  useEffect(() => {
    if (!provider) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [provider, onClose]);

  return (
    <AnimatePresence>
      {provider && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />
          {/* Sheet */}
          <motion.aside
            key={provider.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[560px] bg-panel border-l border-theme/30 z-[91] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-theme/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-theme/10 overflow-hidden">
                  {provider && <ProviderLogo providerId={provider.id} size={22} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold truncate">{provider.name}</h2>
                  <p className="text-[11px] txt-faint truncate">
                    Provider settings · {provider.requires_base_url ? "key + base URL" : "API key"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Scrollable body — reuses the AdvancedProviderCard fully */}
            <div className="flex-1 overflow-y-auto p-5 bg-background/40">
              <AdvancedProviderCard
                provider={provider}
                storedKey={storedKey}
                onSaved={onSaved}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}