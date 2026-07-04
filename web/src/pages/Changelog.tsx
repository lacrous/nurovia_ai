import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Sparkles, Bug, Zap } from "lucide-react";

interface Entry {
  version: string;
  date: string;
  tag: "feature" | "improvement" | "fix";
  title: string;
  bullets: string[];
}

const ENTRIES: Entry[] = [
  {
    version: "0.5.0",
    date: "Today",
    tag: "feature",
    title: "Settings overhaul · file uploads · vision · voice · export · apply-gated diff",
    bullets: [
      "Tabbed Settings modal: Providers, Defaults, Data, About",
      "Test API keys before saving — green check, then Save",
      "File attachments: drag-drop, images, code, docs (8 MB cap)",
      "Vision-capable providers receive proper image content blocks",
      "Voice input via Web Speech API (Chrome / Edge / Safari)",
      "Per-session Markdown export + bulk JSON backup",
      "Edit-and-resend on any user message",
      "Approval-gated Apply button on every code block",
      "Full Qwen (DashScope) catalogue: 3.7-max / 3.7-plus / 3.6-flash / coder / vl / qwq",
    ],
  },
  {
    version: "0.4.0",
    date: "Earlier this week",
    tag: "feature",
    title: "Council mode · streaming · judge model · 6 providers",
    bullets: [
      "Multi-provider parallel deliberation with vote cards",
      "Streaming SSE for OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, custom",
      "Anthropic browser-direct via the dangerous-direct-browser-access header",
      "Stop / cancel mid-stream",
      "Council on/off toggle in the chat header",
      "Stage indicator: Investigating → Convening → Synthesizing → Done",
    ],
  },
  {
    version: "0.3.0",
    date: "Earlier this week",
    tag: "feature",
    title: "Markdown rendering · syntax highlighting · slash commands",
    bullets: [
      "Real markdown via react-markdown + remark-gfm",
      "Code blocks via prism-react-renderer with line numbers and copy button",
      "Slash commands: /fix, /explain, /test, /refactor, /review",
      "Quick-start chips in empty state",
      "Auto-title sessions from the first message",
    ],
  },
  {
    version: "0.2.0",
    date: "Earlier this week",
    tag: "feature",
    title: "Auth flow · chat shell · session persistence",
    bullets: [
      "Sign in / sign up pages with form validation and password strength",
      "Chat shell: sidebar with sessions, search, settings, theme toggle",
      "localStorage-backed session history",
      "AnimatePresence route transitions",
      "Toast notifications",
    ],
  },
  {
    version: "0.1.0",
    date: "Earlier this week",
    tag: "feature",
    title: "Landing page · animated background · 3D avatar",
    bullets: [
      "Hero with animated gradient background",
      "Trust bar, Features, How it works, Pricing, Footer",
      "Lazy-loaded 3D gold orb (react-three-fiber)",
      "Responsive light + dark theme with auto system detection",
    ],
  },
];

const FIXES: Entry[] = [
  {
    version: "0.4.1",
    date: "Earlier this week",
    tag: "fix",
    title: "Stability fixes",
    bullets: [
      "Council mode no longer triggers on a single configured provider",
      "Anthropic request no longer fails when content is purely multimodal",
      "Toast stacking on overlapping errors",
    ],
  },
];

const ALL = [...ENTRIES, ...FIXES].sort((a, b) =>
  a.version === b.version ? 0 : b.version.localeCompare(a.version)
);

export function Changelog() {
  useDocumentTitle("Changelog");
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <div className="mb-10">
        <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Changelog</span>
        <h1 className="text-[32px] sm:text-[40px] font-bold mt-2 leading-tight">What's new.</h1>
        <p className="text-[14px] txt-muted mt-3">
          Every release, every fix, every council-mode tweak. Updated whenever something ships.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px]">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="txt-body">Currently in <strong className="text-gold">public beta</strong> · v0.5.0</span>
        </div>
      </div>

      <ol className="relative pl-6 border-l-2 border-theme/30 space-y-10">
        {ALL.map((entry) => (
          <li key={entry.version + entry.title} className="relative">
            <span
              className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                entry.tag === "feature"
                  ? "bg-gold"
                  : entry.tag === "fix"
                  ? "bg-emerald-400"
                  : "bg-blue-400"
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <span className="text-[11px] font-mono text-gold font-semibold">v{entry.version}</span>
              <span className="text-[10px] uppercase tracking-widest txt-faint">{entry.date}</span>
              <TagBadge tag={entry.tag} />
            </div>
            <h2 className="text-[18px] font-bold">{entry.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {entry.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] txt-body">
                  <span className="text-gold shrink-0 mt-1">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-gold/20 bg-gold/5 p-6 text-center">
        <Sparkles className="w-6 h-6 text-gold mx-auto" />
        <p className="text-[14px] font-semibold mt-3">That's everything so far.</p>
        <p className="text-[12.5px] txt-muted mt-1">
          Beta moves fast — check back next week.
        </p>
      </div>
    </div>
  );
}

function TagBadge({ tag }: { tag: Entry["tag"] }) {
  const map = {
    feature: { icon: Sparkles, label: "Feature", cls: "bg-gold/15 text-gold border-gold/30" },
    improvement: { icon: Zap, label: "Improvement", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    fix: { icon: Bug, label: "Fix", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  } as const;
  const { icon: Icon, label, cls } = map[tag];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-wider ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}