import { motion } from "framer-motion";
import { Brain, Search, Wrench, Scale, Check, ChevronRight } from "lucide-react";
import type { Stage } from "../../services/api";

interface AgentStepTrackerProps {
  stage: Stage;
  detail?: string;
  toolDetail?: string;
}

const STEPS: Array<{ key: Stage; label: string; icon: typeof Brain }> = [
  { key: "planning",      label: "Planning",        icon: Brain },
  { key: "investigating", label: "Investigating",   icon: Search },
  { key: "tool_call",     label: "Calling tool",    icon: Wrench },
  { key: "synthesizing",  label: "Synthesizing",    icon: Scale },
  { key: "done",          label: "Done",            icon: Check },
];

/**
 * Visual step tracker that lights up as the agent moves through its phases.
 * Compact horizontal pill bar that lives above the messages.
 */
export function AgentStepTracker({ stage, detail, toolDetail }: AgentStepTrackerProps) {
  const activeIdx = STEPS.findIndex((s) => s.key === stage);
  const current = STEPS[activeIdx];
  const isDone = stage === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme/20 bg-surface/40 backdrop-blur-sm text-[11px] txt-muted"
    >
      {STEPS.map((s, i) => {
        const isActive = i === activeIdx && !isDone;
        const isComplete = i < activeIdx || isDone;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                  isComplete
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isActive
                    ? "bg-gold/15 text-gold animate-pulse"
                    : "bg-surface text-muted-foreground/50"
                }`}
              >
                {isComplete ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              </div>
              <span
                className={`transition-colors ${
                  isActive ? "text-gold font-semibold" : isComplete ? "txt-body" : "txt-faint"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 txt-faint" />
            )}
          </div>
        );
      })}
      {(detail || toolDetail) && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-mono">
          {toolDetail ?? detail}
        </span>
      )}
      {current && !isDone && (
        <span className="sr-only">Currently in {current.label}</span>
      )}
    </motion.div>
  );
}
