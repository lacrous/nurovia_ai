import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { SEO } from "./components/SEO";
import { CouncilDemo } from "./components/CouncilDemo";
import {
  Brain,
  Cpu,
  FileCode2,
  Layers,
  Lock,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Zap,
  Code2,
  Bot,
} from "lucide-react";
import { Link } from "react-router-dom";

const Avatar3D = lazy(() => import("./components/Avatar3D").then((m) => ({ default: m.UserAvatar })));

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5 group">
      <img
        src="/logo-icon.svg"
        alt=""
        className="w-8 h-8 group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all"
      />
      <span className="text-[18px] font-bold text-gold tracking-tight">Nurovia AI</span>
    </a>
  );
}

function Hero() {
  const [showAvatar, setShowAvatar] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4 overflow-hidden bg-glow">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gold/5 blur-[140px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold mb-6"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Autonomous coding intelligence
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 text-center text-[42px] sm:text-[56px] lg:text-[72px] font-bold leading-[1.08] tracking-tight max-w-4xl"
      >
        The first AI that{" "}
        <span className="text-gold text-glow">reasons with a council</span>{" "}
        before it touches your code.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 text-center text-[16px] sm:text-[18px] txt-muted max-w-2xl mt-6 leading-relaxed"
      >
        Nurovia AI is an autonomous coding companion that debates your bug across multiple expert models,
        proposes validated fixes, and applies them only with your approval.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-10"
      >
        <Link to="/chat" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gold text-white font-bold text-[14px] hover:bg-gold-light transition-colors shadow-lg shadow-gold/10">
          <Play className="w-4 h-4 fill-nu-900" />
          Start debugging free
        </Link>
        <button
          onClick={() => setShowAvatar((v) => !v)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-surface border border-theme/50 text-[14px] font-semibold txt-body hover:border-gold/40 hover:text-gold transition-colors"
        >
          <Bot className="w-4 h-4" />
          {showAvatar ? "Hide 3D avatar" : "Meet the Nurovia avatar"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-10 w-full max-w-5xl mt-16"
      >
        <CouncilDemo />
      </motion.div>

      {/* Hidden static mockup (legacy, kept for SEO/no-JS fallback) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-10 hidden w-full max-w-5xl mt-16 rounded-2xl border border-gold/20 bg-panel/60 backdrop-blur-sm shadow-2xl shadow-gold/5 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 p-5 sm:p-6 space-y-4 font-mono text-[12px] border-b lg:border-b-0 lg:border-r border-gold/10">
            <div className="flex items-center gap-2 pb-3 border-b border-theme/20">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-[11px] txt-faint font-medium">Nurovia AI debug session</span>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3 h-3 text-gold" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] txt-faint">You</div>
                <div className="txt-body">My FastAPI app throws 422 on POST /users after the latest Pydantic upgrade.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Brain className="w-3 h-3 text-gold" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-[11px] txt-faint">Nurovia AI</div>
                <div className="txt-body">I'll inspect the model and route. Council is debating the most likely cause...</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div className="p-2 rounded-lg bg-surface border border-theme/30 text-[10px] txt-muted">
                    <span className="text-gold">claude</span> suggests validator rename
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-theme/30 text-[10px] txt-muted">
                    <span className="text-gold">openai</span> checks field aliases
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-theme/30 text-[10px] txt-muted">
                    <span className="text-gold">deepseek</span> votes config drift
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-[12px] txt-body">
                  Consensus: replace deprecated <code className="text-gold">Config</code> class with <code className="text-gold">model_config</code>. Apply the 3-line diff?
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 relative min-h-[300px] bg-gradient-to-br from-gold/5 to-transparent">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin mb-3" />
                  <span className="text-[12px]">Loading 3D avatar...</span>
                </div>
              }
            >
              {showAvatar ? (
                <Avatar3D />
              ) : (
                <button
                  onClick={() => setShowAvatar(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center group"
                >
                  <div className="relative w-24 h-24 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/15 group-hover:scale-105 transition-all">
                    <Bot className="w-10 h-10 text-gold" />
                    <div className="absolute inset-0 rounded-full border border-gold/20 animate-ping opacity-30" />
                  </div>
                  <span className="text-[13px] font-medium text-gold">Summon Nurovia avatar</span>
                  <span className="text-[11px] txt-muted mt-1">Lazy-loaded WebGL scene</span>
                </button>
              )}
            </Suspense>
          </div>
        </div>
      </motion.div>

      <motion.a
        href="#features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] txt-muted hover:text-gold transition-colors"
      >
        <span>Scroll</span>
        <div className="w-5 h-8 rounded-full border border-theme/40 flex items-start justify-center p-1">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-1.5 rounded-full bg-gold"
          />
        </div>
      </motion.a>
    </section>
  );
}

function TrustBar() {
  const items = ["TypeScript", "Python", "Go", "Rust", "React", "FastAPI"];
  return (
    <section className="py-12 border-y border-theme/20 bg-panel/30 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-[11px] txt-faint uppercase tracking-widest mb-8">Built for developers who ship</p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-16 w-max"
          >
            {[...items, ...items].map((tech, i) => (
              <div key={`${tech}-${i}`} className="flex items-center gap-2 text-[15px] font-semibold txt-muted opacity-70">
                <Code2 className="w-4 h-4 text-gold" />
                {tech}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Layers,
    title: "Council of models",
    desc: "Every bug is debated by multiple top-tier models. No single model hallucination decides your fix.",
  },
  {
    icon: Terminal,
    title: "Autonomous debugging",
    desc: "Nurovia reads your files, runs tests, and traces errors until it finds the root cause.",
  },
  {
    icon: ShieldCheck,
    title: "Approval-gated edits",
    desc: "Mutating changes pause for your explicit approval. You stay in control of every line changed.",
  },
  {
    icon: Cpu,
    title: "Provider-agnostic",
    desc: "Bring your own API keys or use ours. Switch between OpenAI, Claude, Gemini, DeepSeek, and more.",
  },
  {
    icon: FileCode2,
    title: "Project-aware context",
    desc: "Upload a repo, paste a stack trace, or point to a file. Nurovia reasons across your whole codebase.",
  },
  {
    icon: Lock,
    title: "Private by default",
    desc: "Your code stays in your isolated workspace. Encrypted at rest and never used to train public models.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Features</span>
          <h2 className="text-[32px] sm:text-[40px] font-bold mt-3">Why developers choose Nurovia AI</h2>
          <p className="text-[15px] txt-muted mt-4 max-w-2xl mx-auto">
            Not another chatbot. A deliberate, multi-agent system designed to understand, debate, and safely fix real code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-panel/40 border border-theme/20 hover:border-gold/30 hover:bg-panel/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
                <f.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{f.title}</h3>
              <p className="text-[13px] txt-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Upload your project",
    desc: "Drop a ZIP or connect a repo. Nurovia indexes your files without modifying anything.",
  },
  {
    num: "02",
    title: "Describe the bug",
    desc: "Paste an error, a failing test, or just describe what broke. Nurovia asks clarifying questions if needed.",
  },
  {
    num: "03",
    title: "Council investigates",
    desc: "Multiple AI providers debate the cause, inspect code, and converge on the most likely fix.",
  },
  {
    num: "04",
    title: "Approve and apply",
    desc: "Review the proposed diff, approve it, and Nurovia applies the change and runs your tests.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 border-y border-theme/20 bg-panel/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">How it works</span>
          <h2 className="text-[32px] sm:text-[40px] font-bold mt-3">From bug report to fixed code</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative p-6 rounded-2xl bg-panel/40 border border-theme/20"
            >
              <div className="text-[32px] font-bold text-gold/30 mb-4">{s.num}</div>
              <h3 className="text-[17px] font-semibold mb-2">{s.title}</h3>
              <p className="text-[13px] txt-muted leading-relaxed">{s.desc}</p>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gold/30" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      desc: "For personal side projects and experiments.",
      features: ["3 projects", "10 sessions/month", "Community support", "BYOK or shared pool"],
      cta: "Join beta",
      popular: false,
    },
    {
      name: "Pro",
      monthlyPrice: "$29",
      yearlyPrice: "$24",
      period: yearly ? "/month, billed yearly" : "/month",
      desc: "For professional developers shipping every day.",
      features: ["Unlimited projects", "Unlimited sessions", "Priority providers", "Private memory namespace"],
      cta: "Get early access",
      popular: true,
    },
    {
      name: "Team",
      monthlyPrice: "$99",
      yearlyPrice: "$82",
      period: yearly ? "/month, billed yearly" : "/month",
      desc: "For engineering teams that want shared knowledge.",
      features: ["Everything in Pro", "Up to 10 seats", "Shared team lessons", "SSO & audit logs"],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Pricing</span>
          <h2 className="text-[32px] sm:text-[40px] font-bold mt-3">Simple, usage-based pricing</h2>
          <p className="text-[15px] txt-muted mt-4 max-w-2xl mx-auto">
            Bring your own API keys to pay only what the providers charge, or use our pooled credits.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-[13px] ${!yearly ? "text-foreground font-medium" : "txt-muted"}`}>Monthly</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className="relative w-12 h-6 rounded-full bg-surface border border-theme/30 transition-colors"
            aria-label="Toggle yearly billing"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative p-6 rounded-2xl border flex flex-col ${plan.popular ? "border-gold/40 bg-gold/5" : "border-theme/20 bg-panel/40"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-white text-[10px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Most popular
                </div>
              )}
              <h3 className="text-[18px] font-semibold">{plan.name}</h3>
              <div className="flex flex-wrap items-baseline gap-1 mt-3">
                <span className="text-[40px] font-bold">{yearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                {plan.period && <span className="text-[13px] txt-muted">{plan.period}</span>}
              </div>
              <p className="text-[13px] txt-muted mt-2 mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-[13px] txt-body">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl text-[13px] font-semibold transition-colors ${
                  plan.popular
                    ? "bg-gold text-white hover:bg-gold-light"
                    : "bg-surface border border-theme/50 hover:border-gold/40 hover:text-gold"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "The council caught a Pydantic migration bug our single-model review missed. Three models disagreed on the cause, the synthesis nailed the actual fix. We ship faster now.",
    name: "Mira Castellanos",
    role: "Staff engineer, fintech",
    color: "#D4AF37",
  },
  {
    quote:
      "I gave it our gnarliest legacy React class component. Claude said one thing, GPT-4 said another, the chair pulled them together into a refactor plan I could actually ship. Wildly useful.",
    name: "Hiroshi Tanaka",
    role: "Frontend lead, e-commerce",
    color: "#5B9EFF",
  },
  {
    quote:
      "Approval-gated diffs are the killer feature. I see what the AI wants to change, I see the actual diff, I click apply. Nothing writes to disk without my say-so.",
    name: "Sasha Ivanova",
    role: "Solo founder",
    color: "#A78BFA",
  },
  {
    quote:
      "BYOK was the dealbreaker for our security review. Keys never leave the browser, the team is happy, I'm happy.",
    name: "Diego Marín",
    role: "CTO, healthcare",
    color: "#34D399",
  },
];

function Testimonials() {
  return (
    <section className="py-24 px-4 border-y border-theme/20 bg-panel/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Loved by builders</span>
          <h2 className="text-[32px] sm:text-[40px] font-bold mt-3">What people say after the council.</h2>
          <p className="text-[14px] txt-muted mt-4 max-w-2xl mx-auto">
            Beta testers, early customers, and the engineers we built it with.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="p-6 rounded-2xl bg-panel/40 border border-theme/20 hover:border-gold/30 transition-colors"
            >
              <blockquote className="text-[14.5px] txt-body leading-relaxed">
                <span className="text-gold text-[20px] leading-none mr-1">"</span>
                {t.quote}
                <span className="text-gold text-[20px] leading-none ml-1">"</span>
              </blockquote>
              <figcaption className="flex items-center gap-3 mt-5 pt-4 border-t border-theme/15">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-nu-900 text-[13px] font-bold"
                  style={{ background: t.color }}
                >
                  {t.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{t.name}</p>
                  <p className="text-[11.5px] txt-faint">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-theme/20 bg-panel/30">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Logo />
          <p className="text-[13px] txt-muted mt-4 max-w-sm leading-relaxed">
            Autonomous coding intelligence that debates, validates, and safely applies fixes to your codebase.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold mb-4">Product</h4>
          <div className="flex flex-col gap-2">
            <a href="#features" className="text-[13px] txt-muted hover:text-gold transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] txt-muted hover:text-gold transition-colors">How it works</a>
            <Link to="/pricing" className="text-[13px] txt-muted hover:text-gold transition-colors">Pricing</Link>
            <Link to="/docs" className="text-[13px] txt-muted hover:text-gold transition-colors">Docs</Link>
            <Link to="/dashboard" className="text-[13px] txt-muted hover:text-gold transition-colors">Dashboard</Link>
            <Link to="/chat" className="text-[13px] txt-muted hover:text-gold transition-colors">Start debugging</Link>
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold mb-4">Company</h4>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="text-[13px] txt-muted hover:text-gold transition-colors">About</Link>
            <Link to="/changelog" className="text-[13px] txt-muted hover:text-gold transition-colors">Changelog</Link>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Blog</a>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Careers</a>
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold mb-4">Legal</h4>
          <div className="flex flex-col gap-2">
            <Link to="/privacy" className="text-[13px] txt-muted hover:text-gold transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-[13px] txt-muted hover:text-gold transition-colors">Terms of Service</Link>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-theme/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] txt-faint">© {new Date().getFullYear()} Nurovia AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/signin" className="text-[12px] txt-muted hover:text-gold transition-colors">Sign in</Link>
          <Link to="/signup" className="text-[12px] txt-muted hover:text-gold transition-colors">Join beta</Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <SEO />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Footer />
    </>
  );
}
