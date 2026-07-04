/**
 * Admin metrics — mock data for the admin dashboard.
 * In production, these would come from a real analytics backend
 * (Postgres + Supabase or similar). Kept in localStorage so the
 * dashboard renders with consistent numbers across sessions.
 */

import { PLANS } from "./plans";

const STORAGE_KEY = "nurovia-ai-admin-overrides";

interface Overrides {
  totalUsers?: number;
  mrrUsd?: number;
}

function readOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Overrides;
  } catch {
    return {};
  }
}

function writeOverrides(o: Overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // ignore
  }
}

// Deterministic pseudo-random for stable mock data
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface KpiData {
  totalUsers: number;
  totalUsersDelta: number; // %
  activeNow: number;
  activeNowDelta: number;
  mrrUsd: number;
  mrrUsdDelta: number;
  messagesToday: number;
  messagesTodayDelta: number;
  totalSessions: number;
  avgSessionMessages: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  uptimePercent: number;
}

export interface TimeseriesPoint {
  date: string; // ISO date
  value: number;
}

export interface PlanDistribution {
  planId: string;
  name: string;
  users: number;
  revenue: number;
  color: string;
}

export interface ProviderHealth {
  id: string;
  name: string;
  totalCalls: number;
  successRate: number; // 0-1
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorCount: number;
}

export interface TopUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  messagesThisMonth: number;
  tokensThisMonth: number;
  costUsd: number;
  avatarColor: string;
}

export interface RecentSignup {
  id: string;
  name: string;
  email: string;
  plan: string;
  signedUpAt: string;
  source: string;
  avatarColor: string;
}

export interface IncidentItem {
  id: string;
  title: string;
  severity: "info" | "warning" | "error";
  startedAt: string;
  resolvedAt?: string;
  description: string;
}

export function getKpis(): KpiData {
  const o = readOverrides();
  return {
    totalUsers: o.totalUsers ?? 12847,
    totalUsersDelta: 12.4,
    activeNow: o.mrrUsd ? Math.round((o.totalUsers ?? 12847) * 0.034) : 437,
    activeNowDelta: 8.1,
    mrrUsd: o.mrrUsd ?? 47820,
    mrrUsdDelta: 18.6,
    messagesToday: 38421,
    messagesTodayDelta: 24.3,
    totalSessions: 92841,
    avgSessionMessages: 8.4,
    p50LatencyMs: 1180,
    p95LatencyMs: 4200,
    errorRate: 0.012,
    uptimePercent: 99.94,
  };
}

export function getMrrTimeseries(days = 30): TimeseriesPoint[] {
  const o = readOverrides();
  const rand = seeded(42);
  const target = o.mrrUsd ?? 47820;
  const start = target * 0.65;
  const out: TimeseriesPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const t = days - i;
    const trend = start + (target - start) * (t / days);
    const noise = (rand() - 0.5) * (target * 0.04);
    const date = new Date();
    date.setDate(date.getDate() - i);
    out.push({
      date: date.toISOString().slice(0, 10),
      value: Math.round(trend + noise),
    });
  }
  return out;
}

export function getSignupTimeseries(days = 30): TimeseriesPoint[] {
  const rand = seeded(7);
  const out: TimeseriesPoint[] = [];
  let baseline = 60;
  for (let i = days; i >= 0; i--) {
    baseline += (rand() - 0.4) * 8;
    const date = new Date();
    date.setDate(date.getDate() - i);
    out.push({
      date: date.toISOString().slice(0, 10),
      value: Math.max(20, Math.round(baseline + (rand() - 0.5) * 30)),
    });
  }
  return out;
}

export function getPlanDistribution(): PlanDistribution[] {
  const k = getKpis();
  const total = k.totalUsers;
  const free = Math.round(total * 0.71);
  const pro = Math.round(total * 0.22);
  const team = total - free - pro;
  return PLANS.map((p, i) => {
    if (p.id === "free") {
      return {
        planId: p.id,
        name: p.name,
        users: free,
        revenue: 0,
        color: ["#6B7280", "#D4AF37", "#7C3AED"][i] ?? "#6B7280",
      };
    }
    if (p.id === "pro") {
      return {
        planId: p.id,
        name: p.name,
        users: pro,
        revenue: pro * 19,
        color: ["#6B7280", "#D4AF37", "#7C3AED"][i] ?? "#D4AF37",
      };
    }
    return {
      planId: p.id,
      name: p.name,
      users: team,
      revenue: team * 49,
      color: ["#6B7280", "#D4AF37", "#7C3AED"][i] ?? "#7C3AED",
    };
  });
}

export function getProviderHealth(): ProviderHealth[] {
  return [
    { id: "openai", name: "OpenAI", totalCalls: 184720, successRate: 0.998, p50LatencyMs: 980, p95LatencyMs: 3200, errorCount: 18 },
    { id: "anthropic", name: "Anthropic", totalCalls: 152310, successRate: 0.997, p50LatencyMs: 1240, p95LatencyMs: 4500, errorCount: 22 },
    { id: "gemini", name: "Gemini", totalCalls: 47820, successRate: 0.994, p50LatencyMs: 760, p95LatencyMs: 2100, errorCount: 9 },
    { id: "qwen", name: "Qwen", totalCalls: 31420, successRate: 0.992, p50LatencyMs: 1420, p95LatencyMs: 3800, errorCount: 14 },
    { id: "deepseek", name: "DeepSeek", totalCalls: 21840, successRate: 0.989, p50LatencyMs: 1180, p95LatencyMs: 3100, errorCount: 7 },
    { id: "openrouter", name: "OpenRouter", totalCalls: 9320, successRate: 0.984, p50LatencyMs: 2240, p95LatencyMs: 6800, errorCount: 11 },
  ];
}

const FAKE_NAMES = ["Alex Chen", "Mira Patel", "Jordan Lee", "Sofia Garcia", "Hiroshi Tanaka", "Diana Reyes", "Sasha Ivanova", "Wei Zhang", "Liam O'Connor", "Aisha Mohammed", "Diego Marín", "Priya Kumar"];

export function getTopUsers(limit = 10): TopUser[] {
  const rand = seeded(123);
  const plans = ["free", "pro", "team"];
  return Array.from({ length: limit }).map((_, i) => {
    const name = FAKE_NAMES[i] ?? `User ${i}`;
    const plan = plans[i % plans.length] ?? "free";
    const messages = Math.round(2000 + rand() * 8000);
    const tokens = messages * Math.round(800 + rand() * 1200);
    return {
      id: `user-${i}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@example.com`,
      plan,
      messagesThisMonth: messages,
      tokensThisMonth: tokens,
      costUsd: +(tokens * 0.000003).toFixed(2),
      avatarColor: ["#D4AF37", "#7C3AED", "#16A36A", "#2E7BE6", "#E0397A"][i % 5]!,
    };
  });
}

export function getRecentSignups(limit = 10): RecentSignup[] {
  const _rand = seeded(99);
  void _rand;
  const plans = ["free", "pro", "team"];
  const sources = ["organic", "twitter", "hackernews", "github", "reddit", "producthunt", "direct"];
  return Array.from({ length: limit }).map((_, i) => {
    const name = FAKE_NAMES[(i + 5) % FAKE_NAMES.length] ?? `User ${i}`;
    const date = new Date(Date.now() - i * 1000 * 60 * 17);
    return {
      id: `signup-${i}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@example.com`,
      plan: plans[i % plans.length] ?? "free",
      signedUpAt: date.toISOString(),
      source: sources[i % sources.length] ?? "direct",
      avatarColor: ["#D4AF37", "#7C3AED", "#16A36A", "#2E7BE6", "#E0397A"][(i + 2) % 5]!,
    };
  });
}

export function getIncidents(): IncidentItem[] {
  return [
    {
      id: "inc-1",
      title: "Anthropic rate limit spike",
      severity: "warning",
      startedAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
      description: "Brief 30s of 429s from Anthropic API. Auto-retried successfully. 22 calls affected.",
    },
    {
      id: "inc-2",
      title: "Council mode synthesis timeout",
      severity: "info",
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 3.7).toISOString(),
      description: "When >3 providers participate, synthesis step hit 30s timeout for ~0.8% of sessions. Increased timeout to 45s.",
    },
    {
      id: "inc-3",
      title: "Resolved: OpenAI 500s in EU region",
      severity: "error",
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 21.5).toISOString(),
      description: "EU users saw ~2% error rate for 30 minutes. OpenAI confirmed regional issue. Auto-failover to alternative region worked.",
    },
  ];
}

/** Force-set KPI for testing the dashboard. */
export function overrideKpis(patch: Overrides) {
  writeOverrides({ ...readOverrides(), ...patch });
}