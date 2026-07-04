import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Printer, Check, type LucideIcon } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  body: string;
}

interface LegalLayoutProps {
  pageTitle: string;
  pageKicker: string;
  icon: LucideIcon;
  sections: LegalSection[];
  contactEmail: string;
  contactLabel: string;
  contactHref: string;
  summary?: string;
  relatedLabel?: string;
  relatedHref?: string;
  /** localStorage key for the acceptance record. Disables the banner if omitted. */
  acceptanceKey?: string;
  relatedPagePath?: string;
  relatedPageLabel?: string;
}

/**
 * Shared layout for Privacy & Terms pages:
 *  - Top scroll progress bar
 *  - Sticky table of contents with active section highlight
 *  - Acceptance banner (dismissible, persisted to localStorage)
 *  - Back-to-top button (appears after scrolling)
 *  - Print button
 */
export function LegalLayout({
  pageTitle,
  pageKicker,
  icon: Icon,
  sections,
  contactEmail,
  contactLabel,
  contactHref,
  summary,
  relatedLabel = "Related legal",
  relatedHref,
  acceptanceKey,
  relatedPagePath,
  relatedPageLabel,
}: LegalLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [accepted, setAccepted] = useState<boolean>(() => {
    if (!acceptanceKey) return true;
    try {
      return !!localStorage.getItem(acceptanceKey);
    } catch {
      return false;
    }
  });

  // Track scroll position + active section
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setProgress(pct);
      setShowTop(window.scrollY > 480);

      // Determine which section is "active" — the one whose top is closest to viewport top without going below it
      let current: string | null = null;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - 120 <= 0) current = s.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const acceptTerms = () => {
    if (!acceptanceKey) return;
    try {
      localStorage.setItem(
        acceptanceKey,
        JSON.stringify({ acceptedAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setAccepted(true);
  };

  const toc = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        title: s.title.replace(/^\d+\.\s*/, ""),
        number: (s.title.match(/^\d+/) ?? [""])[0],
      })),
    [sections]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gold z-[55] origin-left"
        style={{ scaleX: progress / 100 }}
        transition={{ duration: 0.1 }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20">
            <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-3">
              On this page
            </p>
            <ul className="space-y-1.5 text-[12.5px]">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`flex items-baseline gap-2 py-1 border-l-2 pl-3 transition-colors ${
                      activeId === t.id
                        ? "border-gold text-gold"
                        : "border-transparent txt-muted hover:text-foreground hover:border-theme/40"
                    }`}
                  >
                    <span className="text-[10px] txt-faint tabular-nums w-5 shrink-0">
                      {t.number}
                    </span>
                    <span className="truncate">{t.title}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-theme/20 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-[11.5px] txt-muted hover:text-gold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <article className="min-w-0">
          <header className="mb-10">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
                  {pageKicker}
                </span>
                <h1 className="text-[32px] sm:text-[40px] font-bold leading-tight">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] txt-muted">
              <span>
                <strong className="text-foreground font-medium">Last updated:</strong>{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {accepted && acceptanceKey && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Check className="w-3 h-3" />
                  Accepted
                </span>
              )}
            </div>
          </header>

          {/* Optional acceptance banner */}
          {acceptanceKey && !accepted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gold/20 bg-gold/5 p-5 mb-8"
            >
              <p className="text-[13px] leading-relaxed mb-3">
                <strong className="text-gold">Quick note:</strong> by continuing to use
                Nurovia after this date you accept the {pageTitle.toLowerCase()} below.
                Tap <em>Acknowledge</em> to record that you've read it.
              </p>
              <button
                onClick={acceptTerms}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold text-white text-[12px] font-semibold hover:bg-gold-light transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                I acknowledge
              </button>
            </motion.div>
          )}

          {summary && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 mb-8">
              <p className="text-[13.5px] leading-relaxed">
                <strong className="text-gold">TL;DR:</strong> {summary}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {sections.map((s, idx) => (
              <motion.section
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.1) }}
                className="rounded-2xl border border-theme/30 bg-panel/40 p-6 sm:p-7 scroll-mt-24"
              >
                <h2 className="text-[17px] font-bold mb-3 flex items-baseline gap-2">
                  <span className="text-gold text-[13px] font-mono tabular-nums">
                    {s.title.match(/^\d+/)?.[0]}.
                  </span>
                  <span>{s.title.replace(/^\d+\.\s*/, "")}</span>
                </h2>
                <div className="text-[13.5px] txt-body leading-relaxed prose-legal">
                  {s.body.split("\n").map((line, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <footer className="mt-10 pt-6 border-t border-theme/20 flex flex-wrap items-center gap-3 text-[12.5px]">
            <a
              href={contactHref}
              className="inline-flex items-center gap-1.5 text-gold hover:underline"
            >
              {contactLabel}: {contactEmail}
            </a>
            <span className="txt-faint">·</span>
            {relatedHref && (
              <Link to={relatedHref} className="txt-muted hover:text-gold">
                {relatedLabel}
              </Link>
            )}
            {relatedPagePath && (
              <>
                {relatedHref && <span className="txt-faint">·</span>}
                <Link to={relatedPagePath} className="txt-muted hover:text-gold">
                  {relatedPageLabel}
                </Link>
              </>
            )}
            <span className="txt-faint">·</span>
            <Link to="/" className="txt-muted hover:text-gold">
              Back to home
            </Link>
            <span className="ml-auto text-[11px] txt-faint hidden sm:inline">
              Word count: {wordCount(sections)} · ~{readMinutes(sections)} min read
            </span>
          </footer>
        </article>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gold text-white shadow-lg hover:bg-gold-light transition-colors flex items-center justify-center"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function wordCount(sections: { body: string }[]) {
  const total = sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0);
  return `${total} words`;
}

function readMinutes(sections: { body: string }[]) {
  const total = sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0);
  return Math.max(1, Math.round(total / 220));
}