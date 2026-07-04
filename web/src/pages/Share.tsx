import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Sparkles, GitFork } from "lucide-react";
import { Markdown } from "../components/Markdown";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToast } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { SESSIONS_KEY } from "../services/api";

interface SharedMessage {
  role: "user" | "assistant" | "system";
  content: string;
  votes?: { model: string; opinion: string }[];
}

interface SharedSnapshot {
  title: string;
  createdAt: string;
  messages: SharedMessage[];
}

function decodeSnapshot(encoded: string): SharedSnapshot | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json) as SharedSnapshot;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function Share() {
  useDocumentTitle("Shared session");
  const { encoded = "" } = useParams<{ encoded: string }>();
  const [snapshot, setSnapshot] = useState<SharedSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const s = decodeSnapshot(encoded);
    if (!s) {
      setError("This share link is invalid or corrupted.");
      return;
    }
    setSnapshot(s);
  }, [encoded]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-[24px] font-bold mb-2">Invalid share link</h1>
        <p className="text-[13.5px] txt-muted mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[12px] txt-muted hover:text-gold transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Nurovia AI
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-gold" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Shared session</span>
            <h1 className="text-[28px] sm:text-[36px] font-bold leading-tight">{snapshot.title || "Untitled session"}</h1>
          </div>
        </div>
        <p className="text-[12px] txt-faint">
          Shared on {new Date(snapshot.createdAt).toLocaleString()} · {snapshot.messages.length} messages
        </p>
      </motion.div>

      <div className="rounded-2xl border border-theme/30 bg-panel/40 p-5 mb-6">
        <p className="text-[12.5px] txt-body leading-relaxed">
          <strong className="text-gold">Read-only view.</strong> This is a snapshot of a Nurovia AI council session.
          To start your own chats, <Link to="/signup" className="text-gold hover:underline">create a free account</Link>.
        </p>
      </div>

      <div className="space-y-4">
        {snapshot.messages.map((m, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border ${
              m.role === "user"
                ? "bg-gold/5 border-gold/20"
                : "bg-panel/40 border-theme/30"
            }`}
          >
            <p className="text-[10px] txt-faint uppercase tracking-wider mb-2">{m.role}</p>
            {typeof m.content === "string" ? (
              <div className="text-[13.5px] txt-body">
                <Markdown>{m.content}</Markdown>
              </div>
            ) : (
              <p className="text-[13px] txt-muted italic">non-text content</p>
            )}
            {m.votes && m.votes.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {m.votes.map((v, j) => (
                  <div key={j} className="p-2 rounded-lg bg-surface border border-theme/20 text-[10.5px] txt-muted">
                    <span className="text-gold font-semibold">{v.model}</span>: {v.opinion}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <button
            onClick={() => {
              try {
                const existingRaw = localStorage.getItem(SESSIONS_KEY);
                const list = existingRaw ? JSON.parse(existingRaw) : [];
                const forked = {
                  id: `fork-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: `${snapshot.title} (forked)`,
                  updatedAt: new Date().toISOString(),
                  messages: snapshot.messages.map((m, i) => ({
                    id: `fork-${i}`,
                    role: m.role,
                    content: typeof m.content === "string" ? m.content : "",
                    ...(m.votes ? { votes: m.votes } : {}),
                  })),
                };
                list.unshift(forked);
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
                toast.success("Forked to your account");
                navigate("/chat");
              } catch {
                toast.error("Could not fork");
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors shadow-lg shadow-gold/10"
          >
            <GitFork className="w-4 h-4" />
            Fork to my account
          </button>
        ) : (
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors shadow-lg shadow-gold/10"
          >
            <Sparkles className="w-4 h-4" />
            Try Nurovia with your own API key
          </Link>
        )}
      </div>
    </div>
  );
}