import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface HelpArticle {
  id: string;
  title: string;
  category: "Get started" | "Chat" | "Council" | "Settings" | "Integrations" | "Account";
  body: string;
  keywords: string[];
}

const ARTICLES: HelpArticle[] = [
  {
    id: "quickstart",
    title: "Quick start: your first council in 60 seconds",
    category: "Get started",
    body: "Sign in → Settings → add an API key for at least one provider → Chat → type a question → the council investigates, deliberates, and synthesizes. Add a second provider to enable council mode.",
    keywords: ["setup", "tutorial", "start", "first", "begin"],
  },
  {
    id: "providers",
    title: "Which provider should I start with?",
    category: "Get started",
    body: "OpenAI gpt-4o-mini is the cheapest general-purpose starter. Anthropic Claude 3.5 Sonnet is the best for code review. Add both and council mode lights up automatically.",
    keywords: ["provider", "model", "openai", "anthropic", "claude", "gpt"],
  },
  {
    id: "council",
    title: "What is council mode and when should I use it?",
    category: "Council",
    body: "Council mode (auto-engages when ≥2 providers are configured) fans your question out to every provider in parallel, shows each model's opinion, and asks one model to synthesize. Use it for high-stakes questions, code reviews, debugging, and design decisions.",
    keywords: ["council", "multiple", "compare", "deliberate"],
  },
  {
    id: "slash",
    title: "Slash commands: /fix, /explain, /test, and more",
    category: "Chat",
    body: "Type / in the chat input to see built-in commands. /fix for bug fixes, /explain for walkthroughs, /test for test writing, /refactor for cleanups, /review for senior-style review. Add your own in Settings → Commands.",
    keywords: ["slash", "command", "fix", "explain", "test", "refactor"],
  },
  {
    id: "memory",
    title: "Cross-session memory",
    category: "Chat",
    body: "Add facts you want remembered across all sessions in Settings → Memory. Tagged by category (context / preference / fact / goal). Prepended to every message.",
    keywords: ["memory", "remember", "persistent", "context", "preference"],
  },
  {
    id: "persona",
    title: "Personas: change the council's tone",
    category: "Chat",
    body: "Pick from 8 built-in personas (Senior engineer, Explain to junior, Ship-it, Security, Performance, Product partner, Debugger, Default) or write your own in Settings → Defaults → Persona.",
    keywords: ["persona", "tone", "system prompt", "voice"],
  },
  {
    id: "tools",
    title: "Tools: let the council run code, search the web, calculate",
    category: "Chat",
    body: "The council can call run_python (Pyodide, in-browser), web_search (DuckDuckGo), calculate, and current_datetime. Emit a JSON tool call and the result gets fed back to the model.",
    keywords: ["tool", "function", "calling", "python", "search", "execute"],
  },
  {
    id: "docs",
    title: "Upload your own docs for grounded answers (RAG)",
    category: "Integrations",
    body: "Drop a PDF, markdown, or code file in the chat input. We'll chunk it and retrieve relevant excerpts on every message. Use /docs in the chat toolbar.",
    keywords: ["rag", "upload", "document", "pdf", "grounded"],
  },
  {
    id: "share",
    title: "Share a session with a public link",
    category: "Chat",
    body: "Hover any session in the sidebar → ⋯ menu → Share via link. Copies a URL anyone can open to see the conversation. Logged-in users can fork to their own account.",
    keywords: ["share", "link", "public", "fork"],
  },
  {
    id: "settings-keys",
    title: "Managing API keys",
    category: "Settings",
    body: "Settings → Providers. Add, test, and delete keys. Keys stay in browser localStorage; never reach our servers. Test before saving to verify connectivity.",
    keywords: ["key", "apikey", "api_key", "settings", "provider"],
  },
  {
    id: "workspaces",
    title: "Workspaces: separate keys per project",
    category: "Settings",
    body: "Sidebar bottom → click workspace switcher → create a new workspace. Each has its own API keys, sessions, and settings. Namespaced in localStorage.",
    keywords: ["workspace", "profile", "project", "namespace"],
  },
  {
    id: "themes",
    title: "Themes and accent colors",
    category: "Settings",
    body: "Settings → Defaults → Accent color. 5 presets (Gold, Cobalt, Emerald, Iris, Rose) or pick a custom HSL. Pick light/dark/auto in the top-right toggle.",
    keywords: ["theme", "accent", "color", "dark", "light"],
  },
  {
    id: "mobile",
    title: "Using Nurovia on mobile",
    category: "Account",
    body: "Install as a PWA from the browser menu, or grab the native iOS / Android app. Touch gestures: swipe-left on a session to delete, swipe-right to star.",
    keywords: ["mobile", "ios", "android", "pwa", "app", "install"],
  },
  {
    id: "privacy",
    title: "Privacy: where does my data live?",
    category: "Account",
    body: "Everything lives in your browser's localStorage. We have no servers that touch your chats, your API keys, or your settings. The only network calls are direct from your browser to your configured LLM providers.",
    keywords: ["privacy", "data", "localstorage", "security", "byok"],
  },
  {
    id: "admin",
    title: "Admin / ops dashboard (internal)",
    category: "Account",
    body: "If you have the admin plan or your email is on the ops allowlist, visit /admin for real-time revenue, signups, provider health, and incidents. In dev, mock data is shown. In production, hooked to Postgres/Supabase.",
    keywords: ["admin", "ops", "dashboard", "metrics"],
  },
];

export function Help() {
  useDocumentTitle("Help");
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (!query.trim()) return ARTICLES;
    const q = query.toLowerCase().split(/\s+/).filter(Boolean);
    return ARTICLES.map((a) => {
      const haystack = (a.title + " " + a.body + " " + a.keywords.join(" ") + " " + a.category).toLowerCase();
      let score = 0;
      for (const term of q) {
        const re = new RegExp(`\\b${escapeRegex(term)}`, "i");
        if (re.test(haystack)) score += 1;
        else if (haystack.includes(term)) score += 0.5;
      }
      return { article: a, score };
    })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((m) => m.article);
  }, [query]);

  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-gold" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Help center</span>
          <h1 className="text-[28px] sm:text-[36px] font-bold leading-tight">How can we help?</h1>
        </div>
      </div>
      <p className="text-[13.5px] txt-muted mb-6">
        Search the docs, browse categories, or ask in the{" "}
        <Link to="/chat" className="text-gold hover:underline">chat</Link>.
      </p>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 txt-faint pointer-events-none" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles (try “council”, “API key”, “memory”)"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-panel border border-theme/30 text-[14px] outline-none focus:border-gold/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matches.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-theme/30 bg-panel/40 p-8 text-center">
            <p className="text-[14px] txt-muted">No articles matched "{query}". Try shorter keywords.</p>
          </div>
        ) : (
          matches.map((a, i) => (
            <motion.article
              key={a.id}
              id={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
              className="rounded-2xl border border-theme/30 bg-panel/40 p-5 hover:border-gold/40 transition-colors"
            >
              <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-1">{a.category}</p>
              <h3 className="text-[15px] font-bold txt-head mb-2">{a.title}</h3>
              <p className="text-[12.5px] txt-body leading-relaxed">{a.body}</p>
            </motion.article>
          ))
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/chat"
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 hover:border-gold/40 transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-gold mb-2" />
          <p className="font-semibold text-[14px]">Ask the council</p>
          <p className="text-[11.5px] txt-muted mt-1">Type your question — they'll figure it out together.</p>
        </Link>
        <Link
          to="/docs"
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 hover:border-gold/40 transition-colors"
        >
          <BookOpen className="w-6 h-6 text-gold mb-2" />
          <p className="font-semibold text-[14px]">Full documentation</p>
          <p className="text-[11.5px] txt-muted mt-1">Reference docs for every feature and shortcut.</p>
        </Link>
        <Link
          to="/pricing"
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 hover:border-gold/40 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-gold mb-2" />
          <p className="font-semibold text-[14px]">Upgrade to Pro</p>
          <p className="text-[11.5px] txt-muted mt-1">Council always-on, unlimited history, custom prompts.</p>
        </Link>
      </div>

      <details className="mt-12">
        <summary className="text-[11.5px] txt-faint cursor-pointer hover:text-foreground">Browse by category ({categories.length})</summary>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c) => {
            const count = ARTICLES.filter((a) => a.category === c).length;
            return (
              <a
                key={c}
                href={`#cat-${c}`}
                onClick={(e) => {
                  e.preventDefault();
                  setQuery(c);
                }}
                className="px-3 py-2 rounded-lg border border-theme/20 bg-surface/40 hover:bg-gold/5 hover:border-gold/30 text-[12px]"
              >
                <span className="font-semibold">{c}</span>
                <span className="txt-faint ml-2">{count}</span>
              </a>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}