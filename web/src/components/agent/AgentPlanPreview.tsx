import { motion } from "framer-motion";
import { ListChecks, ArrowRight } from "lucide-react";

/**
 * Renders an agent-mode plan preview at the top of the agent's response —
 * a numbered list of steps the agent intends to follow.
 */
export function AgentPlanPreview({ steps }: { steps: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gold/30 bg-gold/5 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-gold/20 bg-gold/10">
        <ListChecks className="w-3.5 h-3.5 text-gold" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
          Plan
        </span>
        <span className="text-[11px] txt-muted">
          · {steps.length} step{steps.length === 1 ? "" : "s"}
        </span>
      </div>
      <ol className="p-3 space-y-1.5">
        {steps.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-2.5 text-[12px] txt-body"
          >
            <span className="w-5 h-5 rounded-full bg-gold/15 text-gold text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3 h-3 txt-faint mt-1 shrink-0" />
            )}
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}
