import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Target,
  Heart,
  Zap,
  ShieldCheck,
  Globe2,
  Github,
  Twitter,
  ArrowRight,
} from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Your code stays yours",
    body:
      "No middleman server, no telemetry, no model retraining on your prompts. Nurovia calls providers directly from your browser using your own keys.",
  },
  {
    icon: Users,
    title: "Many minds > one",
    body:
      "A single LLM hallucinates. A council of models that disagree with each other is far more likely to surface the right answer — and the cases where they disagree are exactly where you should look first.",
  },
  {
    icon: Target,
    title: "Approval over autonomy",
    body:
      "AI proposes, you decide. Every code change requires your explicit confirmation. Nurovia applies nothing to your codebase without you clicking the button.",
  },
  {
    icon: Heart,
    title: "Built for the craft",
    body:
      "Nurovia is for engineers who ship. No magic buttons, no marketing demos that fall apart on real code. Tools that respect how you actually work.",
  },
];

const TIMELINE = [
  {
    date: "Q2 2026",
    title: "Nurovia AI public beta",
    body: "Council mode lands. Six providers supported out of the box: OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, Qwen. Custom OpenAI-compatible endpoints too.",
  },
  {
    date: "Q2 2026",
    title: "Approval-gated apply",
    body: "Every code block in a council response gets an Apply button. Paste the current code, see the diff, copy or download.",
  },
  {
    date: "Q2 2026",
    title: "First deploy",
    body: "Landing page, sign-in, sign-up, chat, dashboard, docs, pricing, changelog, legal — the full surface area ships as a single PWA-ready SPA.",
  },
];

const STACK = [
  "React 19",
  "Vite 7",
  "TypeScript 5.9",
  "Tailwind 3",
  "react-three-fiber",
  "react-markdown",
  "prism-react-renderer",
  "framer-motion",
  "lucide-react",
  "Web Speech API",
];

export function About() {
  useDocumentTitle("About");
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto mb-16">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-semibold text-gold uppercase tracking-widest"
        >
          About
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-[36px] sm:text-[52px] font-bold mt-3 leading-tight"
        >
          We build coding tools that <span className="text-gold text-glow">respect engineers.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[15px] txt-muted mt-5 leading-relaxed"
        >
          Nurovia AI started with a simple frustration: most AI coding assistants feel like chatbots, not teammates. They hallucinate confidently, propose changes without your approval, and ask you to trust them.
          We thought — what if we made the AI argue with itself first, and then only propose changes you explicitly accept?
        </motion.p>
      </section>

      {/* Mission */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
          <div className="md:sticky md:top-20">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-[24px] font-bold mt-4">Our mission</h2>
            <p className="text-[12px] txt-muted mt-2">One sentence, written in plain language.</p>
          </div>
          <div className="rounded-2xl border border-theme/30 bg-panel/40 p-6 sm:p-8">
            <p className="text-[18px] leading-relaxed txt-body">
              Make AI-assisted debugging <span className="text-gold font-semibold">honest</span> — by forcing models to disagree with each other before they propose a fix, and by requiring your approval before any code changes your repo.
            </p>
            <p className="text-[13px] txt-muted mt-5 leading-relaxed">
              We believe the next decade of software tools will be built on AI copilots — but only if those copilots are accountable, inspectable, and never autonomous without consent.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" />
            What we believe
          </h2>
          <p className="text-[13px] txt-muted mt-1">Four principles that shape every product decision.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-theme/30 bg-panel/40 p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <v.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-[15px] font-semibold mt-3">{v.title}</h3>
              <p className="text-[12.5px] txt-muted mt-1.5 leading-relaxed">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            Where we are
          </h2>
          <p className="text-[13px] txt-muted mt-1">A short timeline of what shipped and what's next.</p>
        </div>
        <ol className="relative pl-6 border-l-2 border-theme/30 space-y-6">
          {TIMELINE.map((t) => (
            <li key={t.title} className="relative">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gold border-2 border-background" />
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">{t.date}</span>
              <h3 className="text-[15px] font-semibold mt-1">{t.title}</h3>
              <p className="text-[12.5px] txt-muted mt-1 leading-relaxed">{t.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Stack */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-gold" />
            How it's built
          </h2>
          <p className="text-[13px] txt-muted mt-1">All client-side. No backend, no tracking, no telemetry.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] txt-body font-mono"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-gold/20 bg-gold/5 p-8 sm:p-10 text-center">
        <Sparkles className="w-7 h-7 text-gold mx-auto" />
        <h2 className="text-[22px] font-bold mt-3">Try the council</h2>
        <p className="text-[13px] txt-muted mt-2 max-w-md mx-auto">
          See what honest AI-assisted debugging feels like. Five minutes from now you'll wonder how you shipped without it.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
          >
            Open chat <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-medium hover:border-gold/40 hover:text-gold transition-colors"
          >
            Read the docs
          </Link>
        </div>
      </section>

      {/* Social */}
      <section className="mt-10 flex items-center justify-center gap-3 text-[12px] txt-muted">
        <a href="#" className="flex items-center gap-1.5 hover:text-gold transition-colors">
          <Github className="w-3.5 h-3.5" />
          GitHub
        </a>
        <span className="opacity-50">·</span>
        <a href="#" className="flex items-center gap-1.5 hover:text-gold transition-colors">
          <Twitter className="w-3.5 h-3.5" />
          X / Twitter
        </a>
        <span className="opacity-50">·</span>
        <Link to="/contact" className="hover:text-gold transition-colors">
          Contact
        </Link>
      </section>
    </div>
  );
}