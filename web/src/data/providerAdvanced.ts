/**
 * Per-provider advanced configuration. Persisted in localStorage.
 * Allows setting temperature, max_tokens, top_p, reasoning effort, system prompt
 * override, custom headers, streaming toggle, JSON mode, and rotation policy.
 */

const STORAGE_KEY = "nurovia-ai-provider-advanced";

export interface CustomHeader {
  key: string;
  value: string;
}

export interface ProviderAdvanced {
  // Generation
  temperature?: number;       // 0.0–2.0
  maxTokens?: number;         // -1 = provider default
  topP?: number;              // 0.0–1.0
  presencePenalty?: number;   // -2.0–2.0
  frequencyPenalty?: number;  // -2.0–2.0
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  seed?: number;

  // Behaviour
  streamEnabled?: boolean;    // false = wait for full response
  jsonMode?: boolean;         // force JSON output
  systemPromptOverride?: string;

  // Rotation & resilience
  /** "failover" = next key on 429/401/5xx. "round-robin" = cycle every request. */
  rotation?: "failover" | "round-robin" | "first-only";
  /** Throttle: minimum ms between consecutive requests with the same key. */
  cooldownMs?: number;

  // Headers for the request
  customHeaders?: CustomHeader[];

  // Identity
  alias?: string;             // friendly name (e.g. "Personal OpenAI")
  /** Optional model override; if set, used instead of default_model for this provider. */
  preferredModel?: string;
}

function read(): Record<string, ProviderAdvanced> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProviderAdvanced>;
  } catch {
    return {};
  }
}

function write(data: Record<string, ProviderAdvanced>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function getAdvanced(providerId: string): ProviderAdvanced {
  return read()[providerId] ?? {};
}

export function updateAdvanced(providerId: string, patch: Partial<ProviderAdvanced>) {
  const data = read();
  data[providerId] = { ...data[providerId], ...patch };
  write(data);
  try {
    window.dispatchEvent(new CustomEvent("nurovia-provider-advanced-changed", { detail: { providerId } }));
  } catch {
    // ignore (SSR / no window)
  }
}

export function resetAdvanced(providerId: string) {
  const data = read();
  delete data[providerId];
  write(data);
}

export function listAll(): Record<string, ProviderAdvanced> {
  return read();
}

/** Effective parameter sent to the provider, falling back to defaults. */
export function effectiveParams(providerId: string, defaultModel?: string) {
  const a = getAdvanced(providerId);
  return {
    temperature: a.temperature ?? 0.7,
    max_tokens: a.maxTokens && a.maxTokens > 0 ? a.maxTokens : undefined,
    top_p: a.topP ?? 1,
    presence_penalty: a.presencePenalty ?? 0,
    frequency_penalty: a.frequencyPenalty ?? 0,
    reasoning_effort: a.reasoningEffort,
    seed: a.seed,
    stream: a.streamEnabled !== false, // default true
    response_format: a.jsonMode ? { type: "json_object" } : undefined,
    system: a.systemPromptOverride,
    preferredModel: a.preferredModel ?? defaultModel,
    customHeaders: a.customHeaders ?? [],
  };
}