import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Info,
  History,
  Activity,
  MessageSquare,
  Settings as Cog,
  Plus,
  Search,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { SESSIONS_KEY } from "../services/api";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: typeof LayoutDashboard;
  group: "Navigation" | "Actions" | "Theme";
  shortcut?: string[];
  action: () => void;
  keywords?: string[];
}

function fuzzyScore(q: string, target: string): number {
  if (!q) return 1;
  const lq = q.toLowerCase();
  const lt = target.toLowerCase();
  if (lt === lq) return 1000;
  if (lt.startsWith(lq)) return 500;
  if (lt.includes(lq)) return 100;
  // Letter-by-letter subsequence
  let qi = 0;
  for (let i = 0; i < lt.length && qi < lq.length; i++) {
    if (lt[i] === lq[qi]) qi++;
  }
  return qi === lq.length ? 10 : 0;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<"commands" | "actions" | "search">("commands");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIdx(0);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setOpen((v) => !v);
        setMode("search");
        setQ("");
        setIdx(0);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQ("");
    setIdx(0);
  };

  const commands = useMemo<Command[]>(() => {
    const nav = (to: string, label: string, icon: typeof LayoutDashboard, desc?: string, keywords?: string[]): Command => ({
      id: `nav:${to}`,
      label,
      description: desc,
      icon,
      group: "Navigation",
      action: () => {
        navigate(to);
        close();
      },
      keywords,
    });

    return [
      nav("/dashboard", "Go to Dashboard", LayoutDashboard, "Recent sessions, stats, quick starts", ["home", "stats"]),
      nav("/chat", "Open Chat", MessageSquare, "Council debug session", ["chat", "council", "debug"]),
      nav("/docs", "Documentation", BookOpen, "How Nurovia works", ["help", "guide", "manual"]),
      nav("/pricing", "Pricing", CreditCard, "Plans and what's included", ["plans", "cost"]),
      nav("/about", "About", Info, "Mission, values, team", ["company"]),
      nav("/changelog", "Changelog", History, "What's new", ["updates", "releases", "what"]),
      nav("/status", "Status", Activity, "System status", ["uptime", "health"]),

      {
        id: "action:new-chat",
        label: "Start a new chat",
        description: "Open chat with a fresh session",
        icon: Plus,
        group: "Actions",
        action: () => {
          navigate("/chat");
          close();
        },
        keywords: ["new", "session"],
      },
      {
        id: "action:settings",
        label: "Open Settings",
        description: "Manage providers, defaults, data",
        icon: Cog,
        group: "Actions",
        action: () => {
          // Settings lives inside Chat, so we navigate to /chat and dispatch an event
          window.dispatchEvent(new CustomEvent("nurovia:open-settings"));
          navigate("/chat");
          close();
        },
        keywords: ["preferences", "config"],
      },
      {
        id: "theme:light",
        label: "Theme: Light",
        description: "Switch to light mode",
        icon: Sun,
        group: "Theme",
        action: () => {
          theme.setTheme("light");
          close();
        },
        keywords: ["appearance", "color"],
      },
      {
        id: "theme:dark",
        label: "Theme: Dark",
        description: "Switch to dark mode",
        icon: Moon,
        group: "Theme",
        action: () => {
          theme.setTheme("dark");
          close();
        },
        keywords: ["appearance", "color"],
      },
      {
        id: "theme:system",
        label: "Theme: System",
        description: "Follow OS preference",
        icon: Monitor,
        group: "Theme",
        action: () => {
          theme.setTheme("system");
          close();
        },
        keywords: ["appearance", "auto"],
      },
    ];
  }, [navigate, theme]);

  const filtered = useMemo(() => {
    if (!q.trim()) return commands;
    const scored = commands
      .map((c) => {
        const haystack = `${c.label} ${c.description ?? ""} ${(c.keywords ?? []).join(" ")}`;
        return { c, score: fuzzyScore(q, haystack) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
    return scored;
  }, [q, commands]);

  useEffect(() => {
    if (idx >= filtered.length) setIdx(0);
  }, [filtered.length, idx]);

  const runCurrent = () => {
    const c = filtered[idx];
    if (c) c.action();
  };

  const grouped = useMemo(() => {
    const out: Record<string, Command[]> = {};
    for (const c of filtered) {
      out[c.group] = out[c.group] ?? [];
      out[c.group]!.push(c);
    }
    return out;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[14vh] px-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-panel border border-theme/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-theme/20 flex items-center gap-3">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    runCurrent();
                  }
                }}
                placeholder={mode === "search" ? "Search all sessions & messages (regex supported)…" : "Jump anywhere, run anything…"}
                className="flex-1 bg-transparent text-[14px] txt-body outline-none placeholder:text-muted-foreground/50"
              />
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">
                Esc
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] txt-muted">
                  No matches for "{q}".
                </div>
              ) : mode === "search" ? (
                <SearchResults q={q} navigate={(path) => { setOpen(false); navigate(path); }} />
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest txt-faint">
                      {group}
                    </p>
                    {items.map((c) => {
                      const globalIdx = filtered.indexOf(c);
                      const active = globalIdx === idx;
                      return (
                        <button
                          key={c.id}
                          onClick={c.action}
                          onMouseEnter={() => setIdx(globalIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                            active ? "bg-gold/10" : "hover:bg-surface"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? "bg-gold/20 text-gold" : "bg-surface text-muted-foreground"
                          }`}>
                            <c.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] txt-body font-medium truncate">{c.label}</p>
                            {c.description && (
                              <p className="text-[11.5px] txt-faint truncate">{c.description}</p>
                            )}
                          </div>
                          {active && (
                            <ArrowRight className="w-3.5 h-3.5 text-gold shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-theme/20 flex items-center justify-between text-[10px] txt-faint">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface border border-theme/30 font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface border border-theme/30 font-mono">↵</kbd>
                  select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-surface border border-theme/30 font-mono">⌘K</kbd>
                toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
interface SearchHit {
  sessionId: string;
  sessionTitle: string;
  messageIndex: number;
  role: "user" | "assistant" | "system";
  content: string;
  matchStart: number;
  matchEnd: number;
}

function SearchResults({ q, navigate }: { q: string; navigate: (path: string) => void }) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      setError(null);
      return;
    }
    let regex: RegExp;
    try {
      regex = new RegExp(q, "i");
    } catch (err) {
      setError("Invalid regex");
      setHits([]);
      return;
    }
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) {
        setHits([]);
        return;
      }
      const sessions = JSON.parse(raw) as Array<{
        id: string;
        title: string;
        messages: Array<{ role: "user" | "assistant" | "system"; content: unknown }>;
      }>;
      const results: SearchHit[] = [];
      for (const s of sessions) {
        if (!s || !Array.isArray(s.messages)) continue;
        for (let i = 0; i < s.messages.length; i++) {
          const m = s.messages[i];
          if (!m) continue;
          const text = typeof m.content === "string" ? m.content : Array.isArray(m.content) ? JSON.stringify(m.content) : "";
          const match = regex.exec(text);
          if (match) {
            results.push({
              sessionId: s.id,
              sessionTitle: s.title,
              messageIndex: i,
              role: m.role,
              content: text,
              matchStart: match.index,
              matchEnd: match.index + match[0].length,
            });
            if (results.length > 50) break;
          }
        }
        if (results.length > 50) break;
      }
      setHits(results);
      setError(null);
    } catch (err) {
      setError("Could not read sessions");
      setHits([]);
    }
  }, [q]);

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-[13px] text-red-400">{error}</div>
    );
  }

  if (!q.trim()) {
    return (
      <div className="px-4 py-8 text-center text-[13px] txt-muted">
        Type a query — supports regex like{" "}
        <code className="px-1 py-0.5 rounded bg-surface border border-theme/20 font-mono text-[11px] text-gold">/api/.*token/i</code>
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[13px] txt-muted">
        No matches for <code className="font-mono text-gold">{q}</code>
      </div>
    );
  }

  return (
    <div className="p-2">
      <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest txt-faint">
        {hits.length} match{hits.length === 1 ? "" : "es"} in messages
      </p>
      {hits.map((h, i) => {
        const before = h.content.slice(Math.max(0, h.matchStart - 30), h.matchStart);
        const match = h.content.slice(h.matchStart, h.matchEnd);
        const after = h.content.slice(h.matchEnd, h.matchEnd + 80);
        return (
          <button
            key={`${h.sessionId}-${h.messageIndex}-${i}`}
            onClick={() => {
              try {
                localStorage.setItem(
                  "nurovia-ai-jump-to",
                  JSON.stringify({ sessionId: h.sessionId, messageIndex: h.messageIndex })
                );
              } catch {
                // ignore
              }
              navigate("/chat");
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface transition-colors"
          >
            <p className="text-[10px] txt-faint uppercase tracking-wider mb-1">
              {h.sessionTitle} · {h.role}
            </p>
            <p className="text-[12.5px] txt-body leading-relaxed line-clamp-2">
              {h.matchStart > 30 && <span className="txt-faint">…{before}</span>}
              <mark className="bg-gold/30 text-gold rounded px-0.5 font-semibold">{match}</mark>
              {after}
              {h.matchEnd + 80 < h.content.length && <span className="txt-faint">…</span>}
            </p>
          </button>
        );
      })}
    </div>
  );
}
