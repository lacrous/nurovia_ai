import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Terminal,
  Calculator,
  Clock,
  Wrench,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Code2,
} from "lucide-react";
import type { ChatStreamEvent } from "../../services/api";

type ToolCallEvt = Extract<ChatStreamEvent, { type: "tool_call" }>;

interface ToolCallCardProps {
  event: ToolCallEvt;
}

const ICONS: Record<string, typeof Search> = {
  web_search: Search,
  run_python: Terminal,
  calculate: Calculator,
  current_datetime: Clock,
  default: Wrench,
};

const LABEL: Record<string, string> = {
  web_search: "Searching the web",
  run_python: "Running Python",
  calculate: "Calculating",
  current_datetime: "Current date/time",
};

function jsonPreview(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resultPreview(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return jsonPreview(value);
}

/**
 * ToolCallCard — renders a tool invocation as a beautiful collapsible card.
 * Two states during execution: pending (spinner) → success/error (with output).
 */
export function ToolCallCard({ event }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[event.tool] ?? Wrench;
  const label = LABEL[event.tool] ?? `Running ${event.tool}`;

  const statusColor =
    event.status === "pending"
      ? "border-gold/30 bg-gold/5"
      : event.status === "success"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-red-500/30 bg-red-500/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${statusColor} overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-surface/40"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            event.status === "pending"
              ? "bg-gold/15 text-gold"
              : event.status === "success"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {event.status === "pending" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : event.status === "success" ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="w-3 h-3 txt-faint" />
            <span className="text-[12.5px] font-semibold txt-body">{label}</span>
            <code className="text-[10px] txt-faint font-mono">({event.tool})</code>
          </div>
          <p className="text-[11px] txt-muted mt-0.5 truncate">
            {event.status === "pending"
              ? "running…"
              : event.status === "success"
              ? `done${event.durationMs ? ` in ${event.durationMs}ms` : ""}`
              : event.error ?? "failed"}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 txt-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-theme/20 overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-black/20">
              <div>
                <p className="text-[10px] font-bold txt-faint uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> arguments
                </p>
                <pre className="text-[11px] font-mono txt-body leading-relaxed whitespace-pre-wrap break-all bg-black/30 rounded-md px-2.5 py-1.5 max-h-48 overflow-y-auto">
                  {jsonPreview(event.arguments)}
                </pre>
              </div>
              {event.status !== "pending" && (
                <div>
                  <p className="text-[10px] font-bold txt-faint uppercase tracking-widest mb-1">
                    result
                  </p>
                  <pre className="text-[11px] font-mono txt-body leading-relaxed whitespace-pre-wrap break-all bg-black/30 rounded-md px-2.5 py-1.5 max-h-64 overflow-y-auto">
                    {event.error ?? resultPreview(event.result)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
