import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  MessageSquare,
  FileText,
  Mic,
  Paperclip,
  Code2,
  ShieldCheck,
  Globe2,
  KeyRound,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  desc: string;
  cta: string;
  ctaHref: string;
  popular?: boolean;
  icon: typeof Sparkles;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    desc: "For personal side projects and weekend experiments.",
    cta: "Join beta",
    ctaHref: "/signup",
    icon: Sparkles,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 29,
    yearly: 24,
    desc: "For professional developers shipping every day.",
    cta: "Get early access",
    ctaHref: "/signup",
    popular: true,
    icon: Zap,
  },
  {
    id: "team",
    name: "Team",
    monthly: 99,
    yearly: 82,
    desc: "For engineering teams that want shared knowledge.",
    cta: "Contact sales",
    ctaHref: "mailto:sales@nurovia.ai",
    icon: Crown,
  },
];

interface Row {
  label: string;
  values: (boolean | string)[];
  group?: string;
}

const COMPARISON: Row[] = [
  { group: "Council", label: "Council members (providers)", values: ["1", "Unlimited", "Unlimited"] },
  { group: "Council", label: "Council deliberation", values: [false, true, true] },
  { group: "Council", label: "Judge-model selection", values: [false, true, true] },
  { group: "Council", label: "Vote cards per response", values: [false, true, true] },

  { group: "Chat", label: "Sessions", values: ["3", "Unlimited", "Unlimited"] },
  { group: "Chat", label: "Messages / month", values: ["10 sessions", "Unlimited", "Unlimited"] },
  { group: "Chat", label: "Streaming responses", values: [true, true, true] },
  { group: "Chat", label: "Edit-and-resend", values: [true, true, true] },
  { group: "Chat", label: "Slash commands", values: [true, true, true] },

  { group: "Input", label: "File attachments", values: [false, true, true] },
  { group: "Input", label: "Vision (image inputs)", values: [false, true, true] },
  { group: "Input", label: "Voice dictation", values: [false, true, true] },
  { group: "Input", label: "Code context", values: [true, true, true] },

  { group: "Output", label: "Markdown rendering", values: [true, true, true] },
  { group: "Output", label: "Syntax highlighting", values: [true, true, true] },
  { group: "Output", label: "Apply-diff workflow", values: [true, true, true] },
  { group: "Output", label: "Patch file download", values: [false, true, true] },

  { group: "Workspace", label: "BYOK (bring your own keys)", values: [true, true, true] },
  { group: "Workspace", label: "Provider pool credits", values: [false, "Optional", "Included"] },
  { group: "Workspace", label: "Priority provider queue", values: [false, false, true] },
  { group: "Workspace", label: "Private memory namespace", values: [false, true, true] },

  { group: "Team", label: "Seats included", values: ["1", "1", "10"] },
  { group: "Team", label: "Shared team lessons", values: [false, false, true] },
  { group: "Team", label: "SSO & audit logs", values: [false, false, true] },

  { group: "Support", label: "Community", values: [true, true, true] },
  { group: "Support", label: "Priority email", values: [false, true, true] },
  { group: "Support", label: "Dedicated CSM", values: [false, false, true] },
];

const FAQ = [
  {
    q: "Do I need to bring my own API keys?",
    a: "On every plan, yes — and we recommend it. Keys are stored locally in your browser and never reach a Nurovia server. Pro and Team plans can optionally use our pooled credits instead, which routes through a small Nurovia relay that adds the key on your behalf.",
  },
  {
    q: "Which providers are supported?",
    a: "OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, Qwen (DashScope), and any OpenAI-compatible endpoint. Council mode works with any combination of two or more.",
  },
  {
    q: "How does council mode use my tokens?",
    a: "Council mode sends your message to N providers in parallel and one more call to the judge for synthesis. So a single round costs roughly (N + 1) × your usual token usage. You can disable it any time and fall back to a single-model chat.",
  },
  {
    q: "Can I switch providers mid-session?",
    a: "Yes. The judge selector in the chat header swaps instantly. Existing chat history is preserved and re-used as context.",
  },
  {
    q: "Is there a self-hosted option?",
    a: "Not yet. The current product is a fully client-side SPA. A self-hostable relay that bundles the council orchestration is on the roadmap for Team customers.",
  },
];

export function PricingPage() {
  useDocumentTitle("Pricing");
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribe = (planId: "free" | "pro" | "team") => {
    if (planId === "free") {
      if (!user) navigate("/signup");
      else navigate("/dashboard");
      return;
    }
    // In production: window.location.href = `https://checkout.stripe.com/c/pay/${priceId}?...`
    // Here: simulate by upgrading the user's plan
    if (user) {
      // Server-side plan upgrade (post-MVP)
      console.log("plan upgrade:", planId);
      navigate("/dashboard?upgraded=" + planId);
    } else {
      navigate("/signup?plan=" + planId);
    }
  };

  const groupedRows: { group: string; rows: Row[] }[] = [];
  let current: { group: string; rows: Row[] } | null = null;
  for (const r of COMPARISON) {
    if (!current || current.group !== r.group) {
      current = { group: r.group!, rows: [] };
      groupedRows.push(current);
    }
    current.rows.push(r);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Pricing</span>
        <h1 className="text-[36px] sm:text-[48px] font-bold mt-2 leading-tight">
          Simple, usage-based pricing.
        </h1>
        <p className="text-[14px] txt-muted mt-4 leading-relaxed">
          Bring your own API keys and pay only what the providers charge — or use our pooled credits and we'll route it for you.
        </p>

        <div className="flex items-center justify-center gap-3 mt-7">
          <span className={`text-[13px] ${!yearly ? "text-foreground font-medium" : "txt-muted"}`}>
            Monthly
          </span>
          <button
            onClick={() => setYearly((v) => !v)}
            aria-label="Toggle yearly billing"
            className="relative w-12 h-6 rounded-full bg-surface border border-theme/30 transition-colors"
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gold"
              animate={{ x: yearly ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </button>
          <span className={`text-[13px] ${yearly ? "text-foreground font-medium" : "txt-muted"}`}>
            Yearly
          </span>
          {yearly && (
            <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-semibold">
              Save 17%
            </span>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 items-stretch">
        {PLANS.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            whileHover={{ y: -4 }}
            className={`relative p-6 rounded-2xl border flex flex-col ${
              plan.popular
                ? "border-gold/40 bg-gold/5 shadow-2xl shadow-gold/5"
                : "border-theme/30 bg-panel/40"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-white text-[10px] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Most popular
              </div>
            )}
            <div className="flex items-center gap-2">
              <plan.icon className="w-5 h-5 text-gold" />
              <h3 className="text-[18px] font-semibold">{plan.name}</h3>
            </div>
            <div className="flex flex-wrap items-baseline gap-1 mt-4">
              <span className="text-[40px] font-bold leading-none">
                ${yearly ? plan.yearly : plan.monthly}
              </span>
              {plan.monthly > 0 && (
                <span className="text-[13px] txt-muted">
                  /month{yearly ? ", billed yearly" : ""}
                </span>
              )}
            </div>
            <p className="text-[13px] txt-muted mt-3">{plan.desc}</p>

            <button
              onClick={() => handleSubscribe(plan.id === "starter" ? "free" : (plan.id as "pro" | "team"))}
              className={`mt-6 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                plan.popular
                  ? "bg-gold text-white hover:bg-gold-light"
                  : "bg-surface border border-theme/30 hover:border-gold/40 hover:text-gold"
              }`}
            >
              {user?.plan && (plan.id === "starter" ? "free" : plan.id) === user.plan ? "Current plan" : plan.cta}
            </button>

            <ul className="mt-6 space-y-2.5 flex-1">
              {planFeaturesFor(plan.id).map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-[12.5px] txt-body">
                  <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </section>

      {/* Comparison table */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Feature comparison
          </h2>
          <p className="text-[13px] txt-muted mt-1">
            Everything that's in each plan. Hover any row on mobile to see the values.
          </p>
        </div>

        <div className="rounded-2xl border border-theme/30 bg-panel/40 overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-surface/60 border-b border-theme/30">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="text-center px-4 py-3 font-semibold min-w-[120px]">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((g) => (
                <>
                  <tr key={g.group} className="bg-gold/5 border-y border-theme/20">
                    <td colSpan={4} className="px-4 py-2 text-[10px] uppercase tracking-widest text-gold font-semibold">
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map((r, i) => (
                    <tr key={`${g.group}-${i}`} className="border-b border-theme/15 last:border-b-0">
                      <td className="px-4 py-2.5 txt-body">{r.label}</td>
                      {r.values.map((v, j) => (
                        <td key={j} className="px-4 py-2.5 text-center">
                          {renderValue(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            What's in every plan
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {EVERY_PLAN_FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-theme/30 bg-panel/40 p-4">
              <f.icon className="w-5 h-5 text-gold" />
              <h3 className="text-[13.5px] font-semibold mt-3">{f.title}</h3>
              <p className="text-[12px] txt-muted mt-1.5 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold" />
            Frequently asked
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-theme/30 bg-panel/40 open:bg-panel/60 transition-colors"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4">
                <span className="text-[13.5px] font-semibold">{item.q}</span>
                <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-[12.5px] txt-muted leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-gold/20 bg-gold/5 p-8 text-center">
        <h2 className="text-[20px] font-bold">Ready when you are.</h2>
        <p className="text-[13px] txt-muted mt-2 mb-5">
          The free Starter plan is generous enough to actually use. Upgrade only when you outgrow it.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}

function planFeaturesFor(id: string): string[] {
  if (id === "starter") {
    return [
      "3 projects",
      "10 sessions per month",
      "Community support",
      "BYOK or shared pool",
      "Streaming responses",
      "Slash commands",
    ];
  }
  if (id === "pro") {
    return [
      "Unlimited projects",
      "Unlimited sessions",
      "Council mode with unlimited members",
      "Vision inputs (image attachments)",
      "Voice dictation",
      "Priority email support",
    ];
  }
  return [
    "Everything in Pro",
    "Up to 10 seats",
    "Shared team lessons",
    "SSO & audit logs",
    "Dedicated CSM",
    "Self-hostable relay (roadmap)",
  ];
}

function renderValue(v: boolean | string) {
  if (v === true) return <Check className="w-4 h-4 text-gold mx-auto" />;
  if (v === false) return <X className="w-4 h-4 txt-faint mx-auto" />;
  return <span className="text-[12.5px] txt-body">{v}</span>;
}

const EVERY_PLAN_FEATURES = [
  {
    icon: KeyRound,
    title: "BYOK",
    body: "Your keys, your models, your spend. Bring keys for any combination of providers.",
  },
  {
    icon: Code2,
    title: "Council mode",
    body: "Fan out to multiple models in parallel. See votes. Get a consensus synthesis.",
  },
  {
    icon: ShieldCheck,
    title: "Approval-gated",
    body: "Nothing writes to disk unless you click Apply. Ever.",
  },
  {
    icon: Paperclip,
    title: "Attachments",
    body: "Drop code, stack traces, screenshots. They go straight to the council.",
  },
  {
    icon: Mic,
    title: "Voice dictation",
    body: "Speak your bug report. Web Speech API keeps it on-device.",
  },
  {
    icon: Globe2,
    title: "Open format",
    body: "Export every session as Markdown, every conversation as JSON. No lock-in.",
  },
];