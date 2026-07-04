import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Send, Loader2 } from "lucide-react";

interface DemoVote {
  model: string;
  opinion: string;
}

const SCRIPTED_VOTES: DemoVote[] = [
  { model: "claude", opinion: "validator rename" },
  { model: "openai", opinion: "field aliases" },
  { model: "deepseek", opinion: "config drift" },
];

const SCRIPTED_SYNTHESIS =
  "**Consensus across the council:** the deprecated `Config` inner class needs to move to the new `model_config = ConfigDict(...)` top-level attribute, and the `email` field should accept `str | None` to match the request body's nullable typing.\n\nDiff:\n\n```python\nclass User(BaseModel):\n-   class Config:\n-       orm_mode = True\n+   model_config = ConfigDict(from_attributes=True)\n    name: str\n-   email: str\n+   email: str | None = None\n```\n\nApply this 4-line diff to fix the 422.";

const SAMPLE_PROMPTS = [
  "My FastAPI app throws 422 on POST /users after upgrading Pydantic.",
  "React useEffect causes infinite re-renders when reading from Zustand store.",
  "Docker compose: backend can't reach postgres on `db:5432` even though DNS resolves.",
];

type Phase = "idle" | "investigating" | "deliberating" | "synthesizing" | "done";

export function CouncilDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState<string>("");
  const [votes, setVotes] = useState<DemoVote[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [voteIndex, setVoteIndex] = useState(0);

  // Demo script player
  useEffect(() => {
    if (phase !== "deliberating") return;
    if (voteIndex >= SCRIPTED_VOTES.length) {
      setPhase("synthesizing");
      return;
    }
    const t = setTimeout(() => {
      setVotes((prev) => [...prev, SCRIPTED_VOTES[voteIndex]!]);
      setVoteIndex((i) => i + 1);
    }, 400);
    return () => clearTimeout(t);
  }, [phase, voteIndex]);

  // Synthesis typewriter
  useEffect(() => {
    if (phase !== "synthesizing") return;
    if (synthesis.length >= SCRIPTED_SYNTHESIS.length) {
      setPhase("done");
      return;
    }
    const speed = 14;
    const t = setTimeout(() => {
      setSynthesis(SCRIPTED_SYNTHESIS.slice(0, synthesis.length + 3));
    }, speed);
    return () => clearTimeout(t);
  }, [phase, synthesis]);

  const handleSubmit = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setSubmitted(t);
    setInput("");
    setVotes([]);
    setSynthesis("");
    setVoteIndex(0);
    setPhase("investigating");
    setTimeout(() => setPhase("deliberating"), 700);
  };

  return (
    <div className="rounded-2xl border border-gold/20 bg-panel/40 backdrop-blur-sm shadow-2xl shadow-gold/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-theme/20 flex items-center justify-between bg-surface/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-3 text-[11px] txt-muted">Nurovia AI · live council demo</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          3 models online
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 sm:p-6 space-y-5 min-h-[280px] max-h-[420px] overflow-y-auto">
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 flex-row-reverse"
          >
            <div className="w-8 h-8 rounded-xl bg-surface border border-theme/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] txt-muted">You</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gold text-white rounded-tr-sm text-[13.5px] max-w-[80%]">
              {submitted}
            </div>
          </motion.div>
        )}

        {/* Phase indicator + votes */}
        {(phase === "investigating" || phase === "deliberating" || phase === "synthesizing") && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-[11.5px] txt-muted">
                <Loader2 className="w-3 h-3 animate-spin text-gold" />
                {phase === "investigating"
                  ? "Investigating…"
                  : phase === "deliberating"
                  ? `Convening the council (${votes.length}/3)`
                  : "Synthesizing consensus…"}
              </div>

              {votes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <AnimatePresence>
                    {votes.map((v) => (
                      <motion.div
                        key={v.model}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-theme/20 text-[10px] txt-muted"
                      >
                        <span className="text-gold font-semibold">{v.model}</span>{" "}
                        <span className="opacity-80">→ {v.opinion}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Synthesis */}
        {(synthesis || phase === "done") && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-surface/70 border border-theme/20 text-[13px] txt-body whitespace-pre-wrap leading-relaxed">
              {synthesis}
              {phase !== "done" && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-gold/60 animate-pulse rounded-sm" />
              )}
            </div>
          </motion.div>
        )}

        {/* Idle state */}
        {phase === "idle" && !submitted && (
          <div className="text-center py-6">
            <Sparkles className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-[13px] txt-muted">Type a bug below or pick a sample to convene the council.</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-theme/20 bg-surface/30">
        {phase === "idle" && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSubmit(p)}
                className="px-2.5 py-1 rounded-full bg-surface border border-theme/30 text-[10.5px] txt-muted hover:text-gold hover:border-gold/40 transition-colors"
              >
                {p.length > 50 ? `${p.slice(0, 50)}…` : p}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !phase.startsWith("deliber") && !phase.startsWith("synth")) {
                handleSubmit();
              }
            }}
            disabled={phase !== "idle"}
            placeholder={
              phase === "idle"
                ? "Try: 'My FastAPI app throws 422 on POST /users'"
                : "Council is deliberating…"
            }
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-surface border border-theme/30 text-[13.5px] placeholder:text-muted-foreground/50 focus:border-gold/50 focus:ring-2 focus:ring-gold/10 outline-none disabled:opacity-60"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={phase !== "idle" || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gold text-white disabled:opacity-40 hover:bg-gold-light transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] txt-faint mt-2">
          {phase === "idle" ? "No signup · no API keys · scripted responses" : "Try a sample prompt above"}
        </p>
      </div>
    </div>
  );
}