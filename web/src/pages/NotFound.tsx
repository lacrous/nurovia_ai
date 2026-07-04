import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { Ghost, Home, MessageSquare, FileSearch, ArrowRight } from "lucide-react";

export function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-xl">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto">
            <Ghost className="w-12 h-12 text-gold" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-gold/20 blur-2xl -z-10" />
        </div>

        <p className="text-[10px] font-semibold text-gold uppercase tracking-widest">Error 404</p>
        <h1 className="text-[36px] sm:text-[52px] font-bold mt-3 leading-tight">
          Lost in the <span className="text-gold text-glow">council chambers.</span>
        </h1>
        <p className="text-[14px] txt-muted mt-4 max-w-md mx-auto leading-relaxed">
          The page you're looking for either doesn't exist, was moved during a refactor, or — more likely — never shipped in the first place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-semibold hover:border-gold/40 hover:text-gold transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Open chat
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-semibold hover:border-gold/40 hover:text-gold transition-colors"
          >
            <FileSearch className="w-4 h-4" />
            Read the docs
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-theme/30 bg-panel/40 p-5 text-left">
          <p className="text-[12px] txt-faint mb-3 uppercase tracking-wider">Try one of these instead</p>
          <ul className="space-y-1.5 text-[13px]">
            <li>
              <Link to="/dashboard" className="text-gold hover:underline inline-flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Dashboard
              </Link>
              <span className="txt-muted"> — your recent sessions and provider status</span>
            </li>
            <li>
              <Link to="/pricing" className="text-gold hover:underline inline-flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Pricing
              </Link>
              <span className="txt-muted"> — three tiers, free Starter plan</span>
            </li>
            <li>
              <Link to="/about" className="text-gold hover:underline inline-flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> About
              </Link>
              <span className="txt-muted"> — what we believe and why we built this</span>
            </li>
            <li>
              <Link to="/changelog" className="text-gold hover:underline inline-flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Changelog
              </Link>
              <span className="txt-muted"> — see what shipped recently</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}