import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA install prompt — listens for `beforeinstallprompt` and shows a custom in-app prompt.
 * Dismissed state persists in localStorage.
 */
export function PwaInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    try {
      if (localStorage.getItem("nurovia-ai-install-dismissed")) return;
    } catch {
      // ignore
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const res = await evt.userChoice!;
    if (res.outcome === "accepted") {
      setVisible(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem("nurovia-ai-install-dismissed", new Date().toISOString());
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 right-6 z-[80] max-w-sm rounded-2xl border border-gold/30 bg-panel/95 backdrop-blur-md shadow-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold txt-head">Install Nurovia</p>
            <p className="text-[11.5px] txt-muted mt-0.5">Launch from your OS like a native app. No more browser tabs.</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={install}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-white text-[11.5px] font-semibold hover:bg-gold-light transition-colors"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg text-[11.5px] txt-muted hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}