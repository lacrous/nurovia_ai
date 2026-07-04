/**
 * Admin dashboard — internal Nurovia AI ops view.
 * Mocked data; in production this would query Supabase/Postgres.
 *
 * Access: any user with plan === "admin" or email in ADMIN_EMAILS list.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  MessageSquare,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import {
  getKpis,
  getMrrTimeseries,
  getSignupTimeseries,
  getPlanDistribution,
  getProviderHealth,
  getTopUsers,
  getRecentSignups,
  getIncidents,
} from "../data/admin";
import { LineChart, BarChart, Donut, Sparkline, MetricBar } from "../components/Charts";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

// Admin emails — in production this would be a list on the backend
const ADMIN_EMAILS = new Set([
  "admin@nurovia.ai",
  "alex@nurovia.ai",
  "founder@nurovia.ai",
]);

function isAdmin(user: { email: string; plan?: string } | null): boolean {
  if (!user) return false;
  if (user.plan === "admin") return true;
  return ADMIN_EMAILS.has(user.email);
}

function formatNumber(n: number): string {
  return Intl.NumberFormat("en").format(Math.round(n));
}

function formatUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DeltaPill({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold tabular-nums ${positive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
      <Icon className="w-2.5 h-2.5" />
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  sparkData,
  format = (v: number) => v.toLocaleString(),
}: {
  label: string;
  value: number;
  delta: number;
  icon: React.ComponentType<{ className?: string }>;
  sparkData: number[] | { value: number }[];
  format?: (v: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-theme/30 bg-panel/40 p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gold" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-widest txt-faint">{label}</p>
        </div>
        <DeltaPill value={delta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[28px] font-bold tabular-nums leading-none txt-head">{format(value)}</p>
        <Sparkline data={sparkData.map((d) => (typeof d === "number" ? d : d.value))} width={88} height={32} />
      </div>
    </motion.div>
  );
}

export function Admin() {
  useDocumentTitle("Admin dashboard · Ops");
  const { user } = useAuth();
  const allowed = isAdmin(user);

  // Always call hooks unconditionally — gate render after
  const kpis = useMemo(() => getKpis(), []);
  const mrrSeries = useMemo(() => getMrrTimeseries(30), []);
  const signupSeries = useMemo(() => getSignupTimeseries(30), []);
  const plans = useMemo(() => getPlanDistribution(), []);
  const providers = useMemo(() => getProviderHealth(), []);
  const topUsers = useMemo(() => getTopUsers(8), []);
  const recentSignups = useMemo(() => getRecentSignups(8), []);
  const incidents = useMemo(() => getIncidents(), []);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-[22px] font-bold mb-2">Admin access required</h1>
        <p className="text-[13px] txt-muted mb-6">
          The admin dashboard is restricted to team members with the <code className="px-1 py-0.5 rounded bg-surface border border-theme/20 font-mono text-gold">admin</code> plan.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const kpisForRange = {
    mrrDelta: timeRange === "7d" ? 4.2 : timeRange === "30d" ? kpis.mrrUsdDelta : 21.8,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight">Operations</h1>
          <p className="text-[13px] txt-muted mt-1">
            Real-time view of Nurovia's growth, revenue, and system health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-theme/30 p-1">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  timeRange === r ? "bg-gold text-white" : "txt-muted hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 rounded-xl bg-panel border border-theme/30 text-[12px] txt-body hover:border-gold/40">
            Export report
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total users"
          value={kpis.totalUsers}
          delta={kpis.totalUsersDelta}
          icon={Users}
          sparkData={mrrSeries.map((p) => p.value / 200)}
          format={formatNumber}
        />
        <KpiCard
          label="MRR"
          value={kpis.mrrUsd}
          delta={kpisForRange.mrrDelta}
          icon={DollarSign}
          sparkData={mrrSeries.map((p) => p.value)}
          format={formatUsd}
        />
        <KpiCard
          label="Active now"
          value={kpis.activeNow}
          delta={kpis.activeNowDelta}
          icon={Activity}
          sparkData={Array.from({ length: 24 }, (_, i) => 200 + Math.sin(i * 0.4) * 80 + Math.random() * 40)}
        />
        <KpiCard
          label="Messages today"
          value={kpis.messagesToday}
          delta={kpis.messagesTodayDelta}
          icon={MessageSquare}
          sparkData={signupSeries.map((p) => p.value)}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* MRR trend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[14px] font-semibold">Monthly recurring revenue</h3>
              <p className="text-[11px] txt-faint mt-0.5">Past {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days</p>
            </div>
            <p className="text-[22px] font-bold tabular-nums text-gold">{formatUsd(kpis.mrrUsd)}</p>
          </div>
          <LineChart data={mrrSeries} height={180} />
        </motion.div>

        {/* Plan distribution donut */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5"
        >
          <h3 className="text-[14px] font-semibold mb-3">Plan distribution</h3>
          <div className="flex items-center gap-4">
            <Donut
              data={plans.map((p) => ({ name: p.name, value: p.users, color: p.color }))}
              size={140}
              thickness={20}
              centerLabel="users"
              centerValue={formatNumber(kpis.totalUsers)}
            />
            <div className="flex-1 space-y-2">
              {plans.map((p) => (
                <div key={p.planId} className="flex items-center gap-2 text-[11.5px]">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 txt-body">{p.name}</span>
                  <span className="txt-muted font-mono tabular-nums">{formatNumber(p.users)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Signups */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5"
        >
          <h3 className="text-[14px] font-semibold mb-3">Signups · last 30d</h3>
          <BarChart
            data={signupSeries.map((p) => ({
              label: new Date(p.date).toLocaleDateString("en", { day: "numeric" }),
              value: p.value,
            }))}
            height={140}
            highlightTop={20}
          />
        </motion.div>

        {/* Provider health */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold">Provider health</h3>
            <span className="text-[11px] txt-faint tabular-nums">{(kpis.uptimePercent).toFixed(2)}% uptime</span>
          </div>
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="grid grid-cols-[120px_1fr_80px_80px_60px] gap-3 items-center text-[11.5px]">
                <span className="font-semibold">{p.name}</span>
                <MetricBar
                  label=""
                  value={p.successRate * 100}
                  total={100}
                  color={p.successRate > 0.99 ? "hsl(158 70% 48%)" : p.successRate > 0.97 ? "hsl(45 65% 52%)" : "hsl(0 75% 55%)"}
                />
                <span className="font-mono tabular-nums txt-muted text-right">{p.p50LatencyMs}ms</span>
                <span className="font-mono tabular-nums txt-muted text-right">{p.p95LatencyMs}ms</span>
                <span className="font-mono tabular-nums txt-muted text-right">{p.errorCount}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[120px_1fr_80px_80px_60px] gap-3 mt-3 pt-3 border-t border-theme/15 text-[10px] uppercase tracking-wider txt-faint">
            <span></span>
            <span>success rate</span>
            <span className="text-right">p50</span>
            <span className="text-right">p95</span>
            <span className="text-right">errs</span>
          </div>
        </motion.div>
      </div>

      {/* Top users + recent signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold">Top users by usage</h3>
            <span className="text-[11px] txt-faint">this month</span>
          </div>
          <div className="space-y-2">
            {topUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-nu-900 text-[11px] font-bold shrink-0"
                  style={{ background: u.avatarColor }}
                >
                  {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold truncate">{u.name}</p>
                  <p className="text-[10.5px] txt-faint truncate">{u.email}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase ${u.plan === "team" ? "bg-purple-500/15 text-purple-300" : u.plan === "pro" ? "bg-gold/15 text-gold" : "bg-surface txt-muted"}`}>
                  {u.plan}
                </span>
                <div className="text-right">
                  <p className="text-[12px] font-mono tabular-nums">{formatNumber(u.messagesThisMonth)}</p>
                  <p className="text-[10px] txt-faint">{formatUsd(u.costUsd)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold">Recent signups</h3>
            <span className="text-[11px] txt-faint">last 3 hours</span>
          </div>
          <div className="space-y-2">
            {recentSignups.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-nu-900 text-[11px] font-bold shrink-0"
                  style={{ background: u.avatarColor }}
                >
                  {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold truncate">{u.name}</p>
                  <p className="text-[10.5px] txt-faint truncate">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] txt-muted">{formatRelative(u.signedUpAt)}</p>
                  <p className="text-[9.5px] txt-faint uppercase tracking-wider">{u.source}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System health + incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[14px] font-semibold">All systems operational</h3>
          </div>
          <p className="text-[12px] txt-muted mb-3">99.94% uptime over the last 30 days.</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-lg bg-surface/40 px-2.5 py-2">
              <p className="txt-faint">p50</p>
              <p className="font-mono tabular-nums font-semibold">{kpis.p50LatencyMs}ms</p>
            </div>
            <div className="rounded-lg bg-surface/40 px-2.5 py-2">
              <p className="txt-faint">p95</p>
              <p className="font-mono tabular-nums font-semibold">{kpis.p95LatencyMs}ms</p>
            </div>
            <div className="rounded-lg bg-surface/40 px-2.5 py-2">
              <p className="txt-faint">errs</p>
              <p className="font-mono tabular-nums font-semibold">{(kpis.errorRate * 100).toFixed(2)}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-theme/30 bg-panel/40 p-5 lg:col-span-2"
        >
          <h3 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Incidents
          </h3>
          <div className="space-y-2">
            {incidents.map((i) => {
              const Icon = i.severity === "error" ? AlertTriangle : i.severity === "warning" ? AlertTriangle : Info;
              const color =
                i.severity === "error"
                  ? "text-red-400 bg-red-500/10 border-red-500/20"
                  : i.severity === "warning"
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : "text-blue-400 bg-blue-500/10 border-blue-500/20";
              return (
                <div key={i.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface/40 border border-theme/15">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12.5px] font-semibold">{i.title}</p>
                      {i.resolvedAt ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 uppercase tracking-wider font-bold">Resolved</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 uppercase tracking-wider font-bold">Ongoing</span>
                      )}
                    </div>
                    <p className="text-[11.5px] txt-muted mt-0.5">{i.description}</p>
                    <p className="text-[10px] txt-faint mt-1">
                      <Clock className="w-2.5 h-2.5 inline mr-1" />
                      {formatRelative(i.startedAt)}
                      {i.resolvedAt && ` · resolved ${formatRelative(i.resolvedAt)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[10.5px] txt-faint mt-10"
      >
        Mock data — wire to Supabase / Postgres in production for real-time updates.
      </motion.p>
    </div>
  );
}

// Silence unused import warnings
void TrendingDown;
void Sparkles;