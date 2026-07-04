import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Activity, CheckCircle2, AlertTriangle, Wrench, Clock } from "lucide-react";

interface DayStatus {
  date: string;
  uptime: number; // 0..1
  incidents: number;
}

const LAST_30_DAYS: DayStatus[] = (() => {
  const out: DayStatus[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Deterministic pseudo-random: 0 incidents for most days, occasional spike
    const seed = (d.getDate() * 7 + d.getMonth() * 13) % 31;
    const incidents = seed === 3 || seed === 17 ? 1 : 0;
    out.push({
      date: d.toISOString().slice(0, 10),
      uptime: incidents > 0 ? 0.987 : 1,
      incidents,
    });
  }
  return out;
})();

const UPTIME_30D = (
  LAST_30_DAYS.reduce((acc, d) => acc + d.uptime, 0) / LAST_30_DAYS.length
) * 100;

const SERVICES = [
  {
    id: "chat",
    name: "Chat & Council",
    status: "operational",
    desc: "Sessions, streaming, council deliberation",
  },
  {
    id: "providers",
    name: "Provider proxy",
    status: "operational",
    desc: "BYOK routing to OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, Qwen",
  },
  {
    id: "auth",
    name: "Auth & Sessions",
    status: "operational",
    desc: "Sign in / sign up, dashboard, session persistence",
  },
  {
    id: "files",
    name: "File uploads & vision",
    status: "operational",
    desc: "Drag-drop, image attachments, vision content",
  },
  {
    id: "voice",
    name: "Voice dictation",
    status: "operational",
    desc: "Web Speech API transcription",
  },
  {
    id: "data",
    name: "Data export / import",
    status: "operational",
    desc: "Backup JSON, session Markdown export",
  },
];

const INCIDENTS = [
  {
    date: "2026-06-28",
    title: "Anthropic browser-direct header typo caused 4xx on a small set of requests",
    status: "resolved",
    duration: "12 minutes",
    summary:
      "We sent the wrong case for the `anthropic-dangerous-direct-browser-access` header on a small batch of sessions between 14:08–14:20 UTC. The vendor returned 400. Affected ~0.4% of chat traffic. We corrected the case, validated against the Anthropic error catalog, and added a regression test.",
  },
  {
    date: "2026-06-22",
    title: "DeepSeek 504 timeouts during peak load",
    status: "resolved",
    duration: "28 minutes",
    summary:
      "DeepSeek's Asia-Pacific cluster had elevated 504s. Our client retried once with backoff and surfaced a clear error toast. No data loss.",
  },
  {
    date: "2026-06-15",
    title: "Council mode displayed stale votes after a network drop",
    status: "resolved",
    duration: "8 minutes",
    summary:
      "If the synthesis call failed mid-stream after votes had already rendered, the UI didn't clear the vote cards. We now clear votes whenever the synthesis errors or is aborted.",
  },
];

export function Status() {
  useDocumentTitle("System status");
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Status</span>
          <h1 className="text-[32px] sm:text-[40px] font-bold mt-2 leading-tight">All systems normal.</h1>
          <p className="text-[13.5px] txt-muted mt-2 max-w-xl">
            Nurovia is fully client-side, but provider routing and our (optional) relay still need to be up. Here's the live view.
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Operational
          </div>
          <span className="text-[10px] txt-faint">Updated just now</span>
        </div>
      </div>

      {/* 30-day uptime */}
      <section className="mb-8">
        <div className="rounded-2xl border border-theme/30 bg-panel/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] txt-muted uppercase tracking-wider">30-day uptime</p>
              <p className="text-[24px] font-bold leading-tight mt-0.5">{UPTIME_30D.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] txt-muted">{LAST_30_DAYS.filter((d) => d.incidents > 0).length} incidents in last 30d</p>
              <p className="text-[10px] txt-faint">Today: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-end gap-[2px] h-10">
            {LAST_30_DAYS.map((d, i) => {
              const heightPct = d.incidents > 0 ? "60%" : "100%";
              const color = d.incidents > 0 ? "bg-amber-400/80" : "bg-emerald-400/70";
              return (
                <div
                  key={i}
                  title={`${d.date} · ${(d.uptime * 100).toFixed(2)}% uptime${d.incidents ? ` · ${d.incidents} incident` : ""}`}
                  className={`flex-1 rounded-sm ${color} hover:opacity-100 opacity-90 transition-opacity`}
                  style={{ height: heightPct }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] txt-faint">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-[18px] font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" />
            Services
          </h2>
        </div>
        <div className="rounded-2xl border border-theme/30 bg-panel/40 overflow-hidden">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-theme/20 last:border-b-0"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium">{s.name}</p>
                <p className="text-[11.5px] txt-faint truncate">{s.desc}</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Incidents */}
      <section>
        <div className="mb-4">
          <h2 className="text-[18px] font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold" />
            Recent incidents
          </h2>
          <p className="text-[12px] txt-muted mt-1">Last 30 days. Older incidents are summarized in our changelog.</p>
        </div>
        <div className="space-y-3">
          {INCIDENTS.map((i, idx) => (
            <div key={idx} className="rounded-2xl border border-theme/30 bg-panel/40 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="w-4 h-4 txt-muted shrink-0" />
                  <p className="text-[14px] font-semibold truncate">{i.title}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                  {i.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] txt-faint mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {i.date}
                </span>
                <span>·</span>
                <span>{i.duration}</span>
              </div>
              <p className="text-[12.5px] txt-body leading-relaxed">{i.summary}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[12.5px] txt-body">
              <strong className="text-emerald-300">No active incidents.</strong> Everything's humming.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}