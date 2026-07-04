import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Settings,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Cpu,
  Clock,
  Bug,
  Wrench,
  ScanSearch,
  FlaskConical,
  KeyRound,
} from "lucide-react";
import { SESSIONS_KEY, fetchProviders, type ProviderInfo } from "../services/api";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { PLANS } from "../data/plans";
import { Crown } from "lucide-react";

interface StoredSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{ role: string; content: string | unknown[] }>;
}

const QUICK_PROMPTS = [
  {
    label: "Debug a Python error",
    icon: Bug,
    text: "My FastAPI app throws 422 on POST /users after upgrading Pydantic. Help me find the root cause.",
  },
  {
    label: "Explain a React hook",
    icon: ScanSearch,
    text: "Explain how useEffect's cleanup function works, with an example of a memory leak it prevents.",
  },
  {
    label: "Refactor a function",
    icon: Wrench,
    text: "Refactor this function for readability. Show me the before/after.",
  },
  {
    label: "Write tests",
    icon: FlaskConical,
    text: "Write pytest unit tests for a function that parses JWT tokens and validates the signature.",
  },
];

export function Dashboard() {
  useDocumentTitle("Dashboard · Client");
  const navigate = useNavigate();
  const user = useRequireAuth();
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch {
      // ignore
    }
    fetchProviders().then(setProviders).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const configuredProviders = useMemo(() => providers.filter((p) => p.configured), [providers]);
  const totalMessages = useMemo(
    () => sessions.reduce((acc, s) => acc + s.messages.length, 0),
    [sessions]
  );
  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [sessions]
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Burning the midnight oil";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Client dashboard</span>
        <h1 className="text-[32px] sm:text-[40px] font-bold mt-2 leading-tight">
          {greeting}, {user?.name?.split(" ")[0] ?? "builder"}.
        </h1>
        <p className="text-[14px] txt-muted mt-2 max-w-xl">
          Your Nurovia AI workspace — recent debug sessions, council status, and quick starts.
        </p>
      </motion.div>

      {/* Account plan banner */}
      <PlanBanner />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={MessageSquare}
          label="Sessions"
          value={loading ? "…" : sessions.length.toString()}
          tint="gold"
        />
        <StatCard
          icon={FileText}
          label="Messages"
          value={loading ? "…" : totalMessages.toString()}
          tint="blue"
        />
        <StatCard
          icon={Cpu}
          label="Providers live"
          value={loading ? "…" : `${configuredProviders.length}/${providers.length}`}
          tint="emerald"
        />
        <StatCard
          icon={Clock}
          label="Last activity"
          value={
            recentSessions[0]
              ? relTime(new Date(recentSessions[0].updatedAt))
              : "Never yet"
          }
          tint="purple"
        />
      </div>

      {/* Onboarding checklist — shown when user hasn't fully set up */}
      {!loading && configuredProviders.length === 0 && (
        <OnboardingChecklist providers={providers} />
      )}
      {!loading && configuredProviders.length > 0 && configuredProviders.length < providers.length - 1 && (
        <ProgressChecklist providers={providers} configured={configuredProviders.length} />
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/chat")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors shadow-lg shadow-gold/10"
        >
          <Plus className="w-4 h-4" />
          New debug session
        </button>
        <button
          onClick={() => navigate("/chat")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-semibold hover:border-gold/40 hover:text-gold transition-colors"
        >
          <Settings className="w-4 h-4" />
          Manage providers
        </button>
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-semibold hover:border-gold/40 hover:text-gold transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Read the docs
        </Link>
      </div>

      {/* Council status */}
      <section className="mb-10">
        <SectionHeader title="Council status" subtitle="Active LLM providers in this browser" />
        <div className="rounded-2xl border border-theme/30 bg-surface/40 p-4">
          {loading ? (
            <p className="text-[13px] txt-muted">Checking providers…</p>
          ) : configuredProviders.length === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">No providers configured yet</p>
                <p className="text-[12px] txt-muted mt-1">
                  Add at least one API key in Settings to convene the council. We never see your keys — they live in your browser only.
                </p>
              </div>
              <button
                onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-white text-[12px] font-semibold hover:bg-gold-light transition-colors whitespace-nowrap"
              >
                Add a key <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    p.configured
                      ? "bg-gold/5 border-gold/30"
                      : "bg-background border-theme/20 opacity-60"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.configured ? "bg-emerald-400" : "bg-theme/50"
                    }`}
                  />
                  <span className="text-[12.5px] font-medium">{p.name}</span>
                  {p.supports_vision && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-wider font-semibold">
                      vl
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent sessions */}
      <section className="mb-10">
        <SectionHeader
          title="Recent sessions"
          subtitle={
            recentSessions.length > 0
              ? `${sessions.length} total · sorted by latest activity`
              : "Start your first session and it'll appear here"
          }
        />
        {recentSessions.length === 0 ? (
          <EmptySessionsState onCreate={() => navigate("/chat")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                to="/chat"
                className="group p-4 rounded-2xl border border-theme/30 bg-surface/40 hover:border-gold/40 hover:bg-gold/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold truncate group-hover:text-gold transition-colors">
                      {s.title || "Untitled session"}
                    </p>
                    <p className="text-[11px] txt-faint mt-0.5">
                      {s.messages.length} {s.messages.length === 1 ? "message" : "messages"} · {relTime(new Date(s.updatedAt))}
                    </p>
                  </div>
                </div>
                {s.messages[s.messages.length - 1] && (
                  <p className="text-[11.5px] txt-muted mt-3 line-clamp-2">
                    {truncate(typeof s.messages[s.messages.length - 1].content === "string"
                      ? s.messages[s.messages.length - 1].content as string
                      : "", 140)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick prompts */}
      <section>
        <SectionHeader
          title="Quick starts"
          subtitle="Click any chip to drop a starter prompt into chat"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => navigate("/chat")}
              className="flex items-center gap-3 p-4 rounded-2xl bg-surface/40 border border-theme/30 hover:border-gold/40 hover:bg-gold/5 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <qp.icon className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold">{qp.label}</p>
                <p className="text-[11.5px] txt-muted truncate">{qp.text}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-semibold flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-gold" />
        {title}
      </h2>
      {subtitle && <p className="text-[12px] txt-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function PlanBanner() {
  const user = useRequireAuth();
  const plan = PLANS.find((p) => p.id === (user?.plan ?? "free")) ?? PLANS[0];
  const sessionCount = useMemo(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      const list = raw ? (JSON.parse(raw) as unknown[]) : [];
      return Array.isArray(list) ? list.length : 0;
    } catch {
      return 0;
    }
  }, []);
  const msgLimit = (plan as { limits?: { messagesPerMonth?: number } }).limits?.messagesPerMonth ?? Infinity;
  const usedRatio = msgLimit === Infinity ? 0 : Math.min(1, sessionCount * 6 / msgLimit);
  return (
    <div className="rounded-2xl border border-theme/30 bg-panel/50 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-gold" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">{plan.name} plan</span>
            {plan.id !== "free" && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/15 text-gold uppercase tracking-wider">Active</span>
            )}
          </div>
          <p className="text-[12px] txt-muted mt-0.5 truncate">{plan.blurb}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {msgLimit !== Infinity ? (
          <div className="min-w-[160px]">
            <div className="flex items-center justify-between text-[10px] txt-faint uppercase tracking-wider mb-1">
              <span>This month</span>
              <span>{Math.round(usedRatio * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${usedRatio * 100}%` }} />
            </div>
          </div>
        ) : (
          <span className="text-[10px] txt-faint uppercase tracking-wider">Unlimited</span>
        )}
        <Link
          to="/pricing"
          className="px-3 py-1.5 rounded-lg bg-gold text-white text-[11px] font-semibold hover:bg-gold-light transition-colors"
        >
          {plan.id === "free" ? "Upgrade" : "Manage"}
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
  tint: "gold" | "blue" | "emerald" | "purple";
}) {
  const tintClasses: Record<typeof tint, string> = {
    gold: "bg-gold/10 border-gold/30 text-gold",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  };
  return (
    <div className="rounded-2xl border border-theme/30 bg-surface/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] txt-muted uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tintClasses[tint]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-[24px] font-bold leading-tight">{value}</p>
    </div>
  );
}

function EmptySessionsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-theme/30 bg-surface/30 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
        <MessageSquare className="w-6 h-6 text-gold" />
      </div>
      <p className="text-[14px] font-semibold">No sessions yet</p>
      <p className="text-[12px] txt-muted mt-1 mb-4 max-w-sm mx-auto">
        Start a debug session and the council will convene. Your sessions stay private to your browser.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white text-[12.5px] font-semibold hover:bg-gold-light transition-colors"
      >
        <Plus className="w-4 h-4" />
        Start your first session
      </button>
    </div>
  );
}

function relTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
function OnboardingChecklist(_: { providers: ProviderInfo[] }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("nurovia-ai-onboarding-checklist-dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("nurovia-ai-onboarding-checklist-dismissed", "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const steps = [
    {
      title: "Pick a provider",
      desc: "OpenAI, Anthropic, Gemini, DeepSeek, Qwen, or your own endpoint.",
      icon: KeyRound,
      done: false,
    },
    {
      title: "Add an API key",
      desc: "BYOK — your key stays in your browser. Nothing ever hits our servers.",
      icon: KeyRound,
      done: false,
    },
    {
      title: "Send your first message",
      desc: "Try a slash command like /fix or /review, or paste a stack trace.",
      icon: Sparkles,
      done: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-panel/40 to-panel/40 p-6 sm:p-7"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">Welcome to Nurovia</span>
          <h2 className="text-[18px] font-bold mt-1">Get to your first council response in 3 steps</h2>
          <p className="text-[12.5px] txt-muted mt-1">
            Takes about 90 seconds. You only need one provider to start — add more later to unlock council mode.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-[11px] txt-muted hover:text-foreground px-2 py-1 rounded-md hover:bg-surface"
        >
          Dismiss
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-panel/60 border border-theme/20">
            <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-[12px] font-bold shrink-0">
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{s.title}</p>
              <p className="text-[11px] txt-muted leading-relaxed mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/onboarding")}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors shadow-lg shadow-gold/10"
      >
        <Sparkles className="w-4 h-4" />
        Start setup
      </button>
    </motion.div>
  );
}

function ProgressChecklist({
  providers,
  configured,
}: {
  providers: ProviderInfo[];
  configured: number;
}) {
  const total = providers.length - 1; // exclude "custom" placeholder
  const pct = Math.round((configured / Math.max(1, total)) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border border-theme/30 bg-panel/40 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">Council mode unlocked</span>
          <h3 className="text-[15px] font-bold mt-0.5">
            {configured} of {total} providers configured
          </h3>
        </div>
        <span className="text-[20px] font-bold text-gold">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full bg-gold"
        />
      </div>
      <p className="text-[11.5px] txt-muted">
        Add {Math.max(0, 2 - configured)} more provider{2 - configured === 1 ? "" : "s"} to enable council mode — multi-model deliberation with disagreement surfaced.
      </p>
    </motion.div>
  );
}
