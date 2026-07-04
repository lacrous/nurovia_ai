/**
 * Provider health log — last N test results per provider, used by the request
 * inspector and the latency sparkline in Settings → Providers.
 */

const STORAGE_KEY = "nurovia-ai-provider-health";
const MAX_HISTORY = 20;

export interface HealthSample {
  at: string; // ISO
  ok: boolean;
  latencyMs: number;
  test: "ping" | "light" | "heavy" | "tool" | "json" | "vision" | "audio";
  message: string;
  status?: number;
  /** Last request URL for the request inspector */
  request?: {
    url: string;
    method: string;
    bodyPreview: string;
  };
}

interface HealthStore {
  [providerId: string]: {
    samples: HealthSample[];
    lastStatus: "up" | "down" | "degraded" | "unknown";
  };
}

function readStore(): HealthStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: HealthStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function recordSample(providerId: string, sample: HealthSample) {
  const store = readStore();
  const bucket = store[providerId] ?? { samples: [], lastStatus: "unknown" as const };
  bucket.samples.unshift(sample);
  bucket.samples = bucket.samples.slice(0, MAX_HISTORY);
  if (!sample.ok) bucket.lastStatus = "down";
  else if (sample.latencyMs > 3500) bucket.lastStatus = "degraded";
  else bucket.lastStatus = "up";
  store[providerId] = bucket;
  writeStore(store);
}

export function getHistory(providerId: string): HealthSample[] {
  return readStore()[providerId]?.samples ?? [];
}

export function getStatus(providerId: string): "up" | "down" | "degraded" | "unknown" {
  return readStore()[providerId]?.lastStatus ?? "unknown";
}

export function clearHistory(providerId: string) {
  const store = readStore();
  if (store[providerId]) {
    store[providerId] = { samples: [], lastStatus: "unknown" };
    writeStore(store);
  }
}

export function avgLatency(providerId: string): number | null {
  const samples = getHistory(providerId).filter((s) => s.ok);
  if (samples.length === 0) return null;
  return Math.round(samples.reduce((a, b) => a + b.latencyMs, 0) / samples.length);
}

export function successRate(providerId: string): number | null {
  const samples = getHistory(providerId);
  if (samples.length === 0) return null;
  return Math.round((samples.filter((s) => s.ok).length / samples.length) * 100);
}