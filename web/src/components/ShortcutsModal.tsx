import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import { ModalShell } from "./ModalShell";

interface Shortcut {
  keys: string[];
  description: string;
  category: "Navigation" | "Chat" | "General";
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open command palette", category: "Navigation" },
  { keys: ["/"], description: "Focus chat input", category: "Navigation" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["Esc"], description: "Close modal / cancel edit", category: "General" },
  { keys: ["⌘", "K"], description: "Search chats", category: "Chat" },
  { keys: ["⌘", "↵"], description: "Send message (or save edit)", category: "Chat" },
  { keys: ["Shift", "↵"], description: "New line in chat input", category: "Chat" },
  { keys: ["⌘", "/"], description: "Toggle settings modal", category: "Chat" },
  { keys: ["⌘", "B"], description: "Toggle sidebar", category: "Chat" },
];

const CATEGORIES: Shortcut["category"][] = ["Navigation", "Chat", "General"];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input/textarea (except for ⌘K which works everywhere)
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      // ? key opens shortcuts (shift+/)
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Escape closes
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={() => setOpen(false)}
      widthClass="max-w-lg"
      topClass="pt-[12vh]"
      maxHeightClass="max-h-[80vh]"
      icon={<Keyboard className="w-4 h-4 text-gold" />}
      title="Keyboard shortcuts"
    >
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORIES.map((cat) => {
          const items = SHORTCUTS.filter((s) => s.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider txt-faint">
                {cat}
              </div>
              <div className="space-y-0.5">
                {items.map((s, i) => (
                  <div
                    key={`${cat}-${i}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface"
                  >
                    <span className="text-[12.5px] txt-body">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="min-w-[22px] h-6 px-1.5 inline-flex items-center justify-center rounded-md border border-theme/30 bg-surface text-[11px] font-mono txt-body"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="px-3 pt-3 pb-2 text-[11px] txt-faint border-t border-theme/20 mt-2">
          Tip: on Windows/Linux, use <kbd className="px-1 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">Ctrl</kbd>{" "}
          instead of <kbd className="px-1 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">⌘</kbd>.
        </div>
      </div>
    </ModalShell>
  );
}