// Frontend API layer for Nurovia AI.
//
// Calls LLM providers directly from the browser. API keys are kept in
// localStorage so the user can BYOK. "Council mode" fans a single user
// message out to every configured provider in parallel, gathers their
// one-line diagnoses as "votes", then streams a synthesis from the user's
// selected provider as the consensus response.

export const SESSIONS_KEY = "nurovia-ai-chat-sessions";

import { getAdvanced } from "../data/providerAdvanced";
import { executeTool, toolsAsSystemPrompt, type ToolCall } from "./tools";

export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ImageContentPart {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
}

export interface FileContentPart {
  type: "file";
  name: string;
  mime: string;
  /** Base64-encoded file content. Text-like files are also sent as decoded text. */
  data: string;
  /** When true, the model is informed that the bytes are present but the file is mostly text-like. */
  textPreview?: string;
}

export type ContentPart = TextContentPart | ImageContentPart | FileContentPart;

export type MessageContent = string | ContentPart[];

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: MessageContent;
}

export interface ProviderInfo {
  id: string;
  name: string;
  shortName: string;
  configured: boolean;
  requires_base_url?: boolean;
  default_model?: string;
  base_url?: string;
  /** Whether this provider's chat endpoint accepts image content parts. */
  supports_vision?: boolean;
  /** Suggested alternate models the user can pick from. */
  model_options?: string[];
  /** Free-text note shown in the provider detail sheet. */
  notes?: string;
}

export interface ProviderKeyPublic {
  provider: string;
  masked_key: string;
}

export interface StreamChatOptions {
  provider: string;
  model?: string;
  messages: ChatMessage[];
  /** When true and ≥2 providers are configured, fan out to all providers first. */
  council?: boolean;
  /** Optional context attached by the caller (e.g. pasted code). */
  context?: string;
  /** Abort the in-flight stream. */
  signal?: AbortSignal;
  /** Sampling temperature forwarded to providers that support it. */
  temperature?: number;
  /**
   * Agent mode — when true, the model may emit tool calls (web_search, run_python,
   * calculate, current_datetime) which are executed and their results streamed back
   * as tool_call events before the final answer is produced.
   */
  agentMode?: boolean;
  /** Persona system prompt prepended to every message. */
  personaPrompt?: string;
  /** Per-provider custom system prompt overrides. */
  customSystemPrompts?: Record<string, string>;
}

export interface AddKeyPayload {
  provider: string;
  api_key: string;
  base_url?: string;
  default_model?: string;
}

export interface CouncilVote {
  model: string;
  opinion: string;
}

export type ChatStreamEvent =
  | { type: "stage"; stage: Stage; detail?: string }
  | { type: "votes"; votes: CouncilVote[] }
  | { type: "text"; content: string }
  | {
      type: "tool_call";
      id: string;
      tool: string;
      arguments: Record<string, unknown>;
      /** Pending when running, success/error with result when finished. */
      status: "pending" | "success" | "error";
      result?: unknown;
      error?: string;
      durationMs?: number;
    }
  | {
      type: "plan";
      /** Each plan step is a short human-readable label. */
      steps: string[];
    }
  | { type: "usage"; promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number; provider: string; model: string }
  | { type: "error"; message: string };

export type Stage = "planning" | "investigating" | "deliberating" | "tool_call" | "synthesizing" | "done";

// ---------- Pricing (per 1M tokens) ----------
// Approximate list prices for cost estimation. Override at your own peril.
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  // Anthropic
  "claude-3-5-sonnet-latest": { input: 3, output: 15 },
  "claude-3-5-haiku-latest": { input: 0.8, output: 4 },
  "claude-3-opus-latest": { input: 15, output: 75 },
  "claude-3-sonnet-20240229": { input: 3, output: 15 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  // Gemini
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-2.0-flash-exp": { input: 0, output: 0 },
  // DeepSeek
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek-coder": { input: 0.14, output: 0.28 },
  "deepseek-reasoner": { input: 0.14, output: 0.28 },
  // Qwen
  "qwen3.7-max": { input: 2, output: 6 },
  "qwen3.7-plus": { input: 0.8, output: 2 },
  "qwen3.6-flash": { input: 0.15, output: 1.5 },
  "qwen-coder-plus": { input: 1, output: 4 },
  "qwen-vl-plus": { input: 0.8, output: 2 },
  "qwq-32b": { input: 1, output: 4 },
};

export function getPricing(model: string): { input: number; output: number } {
  if (PRICING[model]) return PRICING[model];
  // Try prefix match for versioned models
  for (const key of Object.keys(PRICING)) {
    if (model.includes(key) || key.includes(model)) return PRICING[key];
  }
  return { input: 1, output: 3 }; // safe default
}

export function estimateTokens(text: string): number {
  // ~4 chars per token is a common heuristic for English
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateMessageTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const m of messages) {
    const text = extractText(m.content);
    total += estimateTokens(text) + 4; // role + formatting overhead
  }
  return total;
}

export function computeCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = getPricing(model);
  // Prices are per 1M tokens
  const inputCost = (promptTokens / 1_000_000) * p.input;
  const outputCost = (completionTokens / 1_000_000) * p.output;
  return inputCost + outputCost;
}

function usageEvent(provider: string, model: string, promptTokens: number, completionTokens: number): ChatStreamEvent {
  return {
    type: "usage",
    provider,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd: computeCost(model, promptTokens, completionTokens),
  };
}

// ---------- Provider catalogue ----------

const PROVIDER_DEFAULTS: Record<string, { base_url?: string; default_model: string }> = {
  openai: { default_model: "gpt-4o-mini" },
  moonshot: { base_url: "https://api.moonshot.cn/v1", default_model: "moonshot-v1-8k" },
  anthropic: { default_model: "claude-3-5-sonnet-latest" },
  gemini: { default_model: "gemini-1.5-flash" },
  deepseek: { base_url: "https://api.deepseek.com/v1", default_model: "deepseek-chat" },
  qwen: { base_url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", default_model: "qwen-plus" },
  nvidia: { base_url: "https://integrate.api.nvidia.com/v1", default_model: "meta/llama-3.1-70b-instruct" },
  grok: { base_url: "https://api.x.ai/v1", default_model: "grok-2-latest" },
  minimax: { base_url: "https://api.MiniMax.chat/v1", default_model: "MiniMax-Text-01" },
  mistral: { base_url: "https://api.mistral.ai/v1", default_model: "mistral-large-latest" },
  openrouter: { base_url: "https://openrouter.ai/api/v1", default_model: "openai/gpt-4o-mini" },
  custom: { base_url: "https://api.openai.com/v1", default_model: "gpt-4o-mini" },
};

const PROVIDER_CATALOG: Omit<ProviderInfo, "configured">[] = [
  {
    id: "openai",
    name: "OpenAI",
    shortName: "openai",
    default_model: PROVIDER_DEFAULTS.openai.default_model,
    supports_vision: true,
    model_options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini", "o3-mini"],
  },
  {
    id: "moonshot",
    name: "Moonshot (Kimi)",
    shortName: "moonshot",
    default_model: PROVIDER_DEFAULTS.moonshot.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.moonshot.base_url,
    supports_vision: false,
    model_options: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k", "moonshot-v1-8k-vision-preview"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    shortName: "claude",
    default_model: PROVIDER_DEFAULTS.anthropic.default_model,
    supports_vision: true,
    model_options: [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
      "claude-sonnet-4-latest",
      "claude-opus-4-latest",
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    shortName: "gemini",
    default_model: PROVIDER_DEFAULTS.gemini.default_model,
    supports_vision: true,
    model_options: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-pro"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "deepseek",
    default_model: PROVIDER_DEFAULTS.deepseek.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.deepseek.base_url,
    supports_vision: false,
    model_options: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
  },
  {
    id: "qwen",
    name: "Qwen (DashScope)",
    shortName: "qwen",
    default_model: PROVIDER_DEFAULTS.qwen.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.qwen.base_url,
    supports_vision: true,
    model_options: [
      "qwen3.7-max",
      "qwen3.7-plus",
      "qwen3.6-max",
      "qwen3.6-plus",
      "qwen3.6-flash",
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
      "qwen-coder-plus",
      "qwen-vl-max",
      "qwq-32b",
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    shortName: "nvidia",
    default_model: PROVIDER_DEFAULTS.nvidia.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.nvidia.base_url,
    supports_vision: true,
    model_options: [
      "meta/llama-3.1-70b-instruct",
      "meta/llama-3.1-405b-instruct",
      "mistralai/mistral-large",
      "google/gemma-2-27b-it",
      "nvidia/nemotron-4-340b-instruct",
    ],
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    shortName: "grok",
    default_model: PROVIDER_DEFAULTS.grok.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.grok.base_url,
    supports_vision: true,
    model_options: ["grok-2-latest", "grok-2-vision-latest", "grok-beta", "grok-1.5"],
  },
  {
    id: "minimax",
    name: "Minimax",
    shortName: "minimax",
    default_model: PROVIDER_DEFAULTS.minimax.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.minimax.base_url,
    supports_vision: false,
    model_options: ["MiniMax-Text-01", "MiniMax-Text-02"],
    notes: "Placeholder — fill base URL with your MiniMax endpoint when ready.",
  },
  {
    id: "mistral",
    name: "Mistral",
    shortName: "mistral",
    default_model: PROVIDER_DEFAULTS.mistral.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.mistral.base_url,
    supports_vision: false,
    model_options: [
      "mistral-large-latest",
      "mistral-small-latest",
      "mistral-medium-latest",
      "codestral-latest",
      "pixtral-large-latest",
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    shortName: "openrouter",
    default_model: PROVIDER_DEFAULTS.openrouter.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.openrouter.base_url,
    supports_vision: true,
    model_options: [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-405b-instruct",
      "qwen/qwen-2.5-72b-instruct",
    ],
  },
  {
    id: "custom",
    name: "Custom OpenAI-compatible",
    shortName: "custom",
    default_model: PROVIDER_DEFAULTS.custom.default_model,
    requires_base_url: true,
    base_url: PROVIDER_DEFAULTS.custom.base_url,
    supports_vision: true,
  },
];

// ---------- Key storage (localStorage) ----------

const KEY_STORE = "nurovia-ai-provider-keys";

interface StoredKey {
  /** Single key (legacy) — preferred to use `keys: string[]` for rotation. */
  api_key: string;
  /** Optional rotation pool. When set, requests cycle through keys on 429/401/5xx. */
  keys?: string[];
  base_url?: string;
  default_model?: string;
}

export function readKeyStore(): Record<string, StoredKey> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY_STORE);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredKey>;
  } catch {
    return {};
  }
}

function writeKeyStore(store: Record<string, StoredKey>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_STORE, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function envKey(providerId: string): string | undefined {
  const map: Record<string, string | undefined> = {
    openai: import.meta.env?.VITE_OPENAI_API_KEY,
    anthropic: import.meta.env?.VITE_ANTHROPIC_API_KEY,
    gemini: import.meta.env?.VITE_GEMINI_API_KEY,
    deepseek: import.meta.env?.VITE_DEEPSEEK_API_KEY,
    openrouter: import.meta.env?.VITE_OPENROUTER_API_KEY,
    qwen: import.meta.env?.VITE_DASHSCOPE_API_KEY,
  };
  return map[providerId];
}

interface ResolvedProvider {
  info: ProviderInfo;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function resolveProvider(id: string, modelOverride?: string): ResolvedProvider | null {
  const info = PROVIDER_CATALOG.find((p) => p.id === id);
  if (!info) return null;
  const store = readKeyStore();
  const stored = store[id];
  const env = envKey(id);
  const apiKey = stored?.api_key ?? env ?? "";
  if (!apiKey) return null;
  const baseUrl =
    stored?.base_url?.trim() || info.base_url || PROVIDER_DEFAULTS[id]?.base_url || "";
  const model = modelOverride || stored?.default_model || info.default_model || "";
  return {
    info: { ...info, configured: true },
    apiKey,
    baseUrl,
    model,
  };
}

function isProviderConfigured(providerId: string): boolean {
  return Boolean(readKeyStore()[providerId]?.api_key || envKey(providerId));
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  await new Promise((r) => setTimeout(r, 60));
  return PROVIDER_CATALOG.map((p) => ({ ...p, configured: isProviderConfigured(p.id) }));
}

export async function fetchKeys(): Promise<ProviderKeyPublic[]> {
  const store = readKeyStore();
  return Object.entries(store).map(([provider, value]) => ({
    provider,
    masked_key: maskKey(value.api_key),
  }));
}

export async function addKey(payload: AddKeyPayload): Promise<void> {
  if (!payload.provider) throw new Error("Provider is required");
  if (!payload.api_key) throw new Error("API key is required");
  const store = readKeyStore();
  store[payload.provider] = {
    api_key: payload.api_key,
    base_url: payload.base_url,
    default_model: payload.default_model,
  };
  writeKeyStore(store);
}

export async function deleteKey(provider: string): Promise<void> {
  const store = readKeyStore();
  delete store[provider];
  writeKeyStore(store);
}

export async function testProvider(id: string): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const resolved = resolveProvider(id);
  if (!resolved) {
    return { ok: false, message: "No API key configured for this provider." };
  }
  return testCredentials(id, resolved.apiKey, resolved.baseUrl, resolved.model);
}

export async function testCredentials(
  id: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  if (!apiKey) return { ok: false, message: "API key is required to test." };
  const t0 = performance.now();
  try {
    let res: Response;
    switch (id) {
      case "openai":
      case "deepseek":
      case "openrouter":
      case "qwen":
      case "custom": {
        const url = `${baseUrl.replace(/\/$/, "")}/models`;
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        break;
      }
      case "anthropic": {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: 4,
            messages: [{ role: "user", content: "ping" }],
          }),
          signal: AbortSignal.timeout(8000),
        });
        break;
      }
      case "gemini": {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;
        res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
          }),
          signal: AbortSignal.timeout(8000),
        });
        break;
      }
      default:
        return { ok: false, message: "Unknown provider" };
    }
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `HTTP ${res.status}: ${text.slice(0, 200)}`,
        latencyMs,
      };
    }
    return { ok: true, message: `Connected · ${latencyMs} ms`, latencyMs };
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }
}

// ---------- Settings (defaults & data) ----------

const SETTINGS_STORE = "nurovia-ai-settings";

export interface AppSettings {
  temperature?: number;
  theme?: "light" | "dark" | "system";
  councilAuto?: boolean;
  preferredSynthesisProvider?: string;
  /** Active persona ID. Default: "default". */
  persona?: string;
  /** Per-provider custom system prompt override. */
  customSystemPrompts?: Record<string, string>;
  /** User-defined slash commands. */
  customCommands?: CustomCommand[];
}

export interface CustomCommand {
  id: string;
  label: string;
  description: string;
  template: string;
  emoji?: string;
}

export async function fetchSettings(): Promise<AppSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORE);
    if (!raw) return {};
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORE, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ---------- Data export / import ----------

export interface ExportEnvelope {
  version: 1;
  exportedAt: string;
  sessions: unknown;
  settings: AppSettings;
}

export async function exportAll(): Promise<ExportEnvelope> {
  const sessions = typeof window !== "undefined" ? window.localStorage.getItem(SESSIONS_KEY) : null;
  const settings = await fetchSettings();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: sessions ? JSON.parse(sessions) : [],
    settings,
  };
}

export async function importAll(envelope: ExportEnvelope): Promise<void> {
  if (!envelope || envelope.version !== 1) {
    throw new Error("Unsupported export version");
  }
  if (envelope.sessions) {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(envelope.sessions));
  }
  if (envelope.settings) {
    await saveSettings(envelope.settings);
  }
}

export interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number;
  update_time?: number;
  mapping?: Record<string, unknown>;
}

export interface ChatGPTExport {
  // ChatGPT exports look like: [{ id, title, create_time, update_time, mapping: { <msgId>: { id, message: { author: { role }, content: { content_type, parts? } } } } }, ...]
  [k: string]: unknown;
}

export function isChatGPTExport(obj: unknown): obj is ChatGPTConversation[] {
  if (!Array.isArray(obj) || obj.length === 0) return false;
  const first = obj[0] as Record<string, unknown>;
  return typeof first?.id === "string" && typeof first?.title === "string" && typeof first?.mapping === "object";
}

export async function importChatGPT(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error("Could not parse JSON — is this a ChatGPT conversations.json export?");
  }
  if (!isChatGPTExport(parsed)) {
    throw new Error("This file doesn't look like a ChatGPT export. Expected an array of conversations with id, title, and mapping.");
  }
  const existingRaw = window.localStorage.getItem(SESSIONS_KEY);
  const existing: Array<{ id: string; title: string; updatedAt?: string; messages: ChatMessage[] }> = existingRaw ? JSON.parse(existingRaw) : [];
  let imported = 0;
  let skipped = 0;
  for (const convo of parsed) {
    try {
      const messages: ChatMessage[] = [];
      const mapping = convo.mapping ?? {};
      for (const node of Object.values(mapping as Record<string, { message?: { author?: { role?: string }; content?: { content_type?: string; parts?: unknown[] } } }>)) {
        const msg = node?.message;
        if (!msg) continue;
        const role = msg.author?.role;
        if (role !== "user" && role !== "assistant" && role !== "system") continue;
        const parts = msg.content?.parts;
        if (!Array.isArray(parts)) continue;
        const text = parts
          .filter((p): p is string => typeof p === "string")
          .join("\n")
          .trim();
        if (!text) continue;
        messages.push({
          role: role as "user" | "assistant" | "system",
          content: text,
        });
      }
      if (messages.length === 0) {
        skipped += 1;
        continue;
      }
      existing.push({
        id: `chatgpt-${convo.id}`,
        title: convo.title || "Imported chat",
        updatedAt: new Date((convo.update_time ?? convo.create_time ?? Date.now() / 1000) * 1000).toISOString(),
        messages,
      });
      imported += 1;
    } catch {
      skipped += 1;
    }
  }
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
  return { imported, skipped };
}

export async function clearAll(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSIONS_KEY);
  window.localStorage.removeItem(KEY_STORE);
  window.localStorage.removeItem(SETTINGS_STORE);
}

export async function sessionToMarkdown(
  session: { title: string; messages: Array<{ role: string; content: string | ContentPart[]; timestamp?: string | Date; votes?: CouncilVote[] }> },
  options: { includeVotes?: boolean } = {}
): Promise<string> {
  const lines: string[] = [];
  lines.push(`# ${session.title || "Untitled session"}`, "");
  for (const m of session.messages) {
    const role = m.role === "user" ? "## You" : "## Nurovia";
    const ts = m.timestamp ? new Date(m.timestamp).toISOString() : "";
    lines.push(role, ts ? `<sub>${ts}</sub>` : "");
    const text = extractText(m.content);
    lines.push(text, "");
    if (options.includeVotes && m.votes && m.votes.length > 0) {
      lines.push("<sub>Council opinions:</sub>");
      for (const v of m.votes) {
        lines.push(`- **${v.model}** → ${v.opinion}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

function extractText(content: string | ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "image_url") return `[image: ${p.image_url.url.slice(0, 60)}…]`;
      if (p.type === "file") return `[file: ${p.name} (${p.mime})]`;
      return "";
    })
    .join("\n");
}

// ---------- Prompts ----------

const COUNCIL_MEMBER_PROMPT = [
  "You are one member of a council of expert AI coding assistants.",
  "Another member of the council will write a final synthesis — your job is just a concise diagnosis.",
  "Output exactly two lines, no preamble:",
  "DIAGNOSIS: <one short sentence naming the most likely root cause>",
  "FIX: <one short sentence naming the single best fix>",
].join(" ");

const SYNTHESIS_PROMPT = [
  "You are the chair of a council of expert AI coding assistants.",
  "Below are independent diagnoses from your colleagues.",
  "Write a concise final response that:",
  "1) Names the consensus diagnosis (call out disagreement if any).",
  "2) Recommends the best fix with rationale.",
  "3) If relevant, includes a minimal code snippet or diff.",
  "Be direct and actionable. Use markdown where it helps.",
].join(" ");

const SINGLE_PROVIDER_PROMPT = [
  "You are Nurovia AI, an autonomous coding assistant.",
  "Help the user debug, design, or improve their code with concrete, actionable advice.",
  "Prefer minimal diffs. Show your reasoning briefly, then give the fix.",
].join(" ");

// ---------- Provider streaming ----------

interface ProviderCall {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  temperature?: number;
  /** Whether this provider can accept image parts. */
  supportsVision?: boolean;
  /** Advanced per-provider overrides. */
  advanced?: import("../data/providerAdvanced").ProviderAdvanced;
  /** Optional explicit custom headers. */
  customHeaders?: import("../data/providerAdvanced").CustomHeader[];
}

class HttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

// Convert our ChatMessage[] into OpenAI's chat.completions format, dropping
// parts the provider can't handle (e.g. images for non-vision providers).
function toOpenAIMessages(messages: ChatMessage[], supportsVision: boolean) {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    const parts = m.content
      .map((p): unknown => {
        if (p.type === "text") return { type: "text", text: p.text };
        if (p.type === "image_url") {
          if (!supportsVision) return null;
          return { type: "image_url", image_url: { url: p.image_url.url } };
        }
        if (p.type === "file") {
          if (supportsVision && p.mime.startsWith("image/")) {
            return {
              type: "image_url",
              image_url: { url: `data:${p.mime};base64,${p.data}` },
            };
          }
          const preview = p.textPreview ?? "(binary file)";
          return {
            type: "text",
            text: `[Attached file: ${p.name} (${p.mime}, ${formatBytes(p.data)})]\n\`\`\`\n${preview.slice(0, 6000)}\n\`\`\``,
          };
        }
        return null;
      })
      .filter(Boolean);
    return { role: m.role, content: parts };
  });
}

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role, content: [{ type: "text", text: m.content }] };
      }
      const blocks = m.content
        .map((p): unknown => {
          if (p.type === "text") return { type: "text", text: p.text };
          if (p.type === "image_url") {
            const url = p.image_url.url;
            const m = url.match(/^data:([^;]+);base64,(.*)$/);
            if (m) {
              return {
                type: "image",
                source: { type: "base64", media_type: m[1], data: m[2] },
              };
            }
            return { type: "image", source: { type: "url", url } };
          }
          if (p.type === "file") {
            if (p.mime.startsWith("image/")) {
              return {
                type: "image",
                source: { type: "base64", media_type: p.mime, data: p.data },
              };
            }
            return {
              type: "text",
              text: `[Attached file: ${p.name} (${p.mime})]\n\`\`\`\n${(p.textPreview ?? "").slice(0, 6000)}\n\`\`\``,
            };
          }
          return null;
        })
        .filter(Boolean);
      return { role: m.role, content: blocks };
    });
}

function toGeminiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        };
      }
      const parts = m.content
        .map((p): unknown => {
          if (p.type === "text") return { text: p.text };
          if (p.type === "image_url") {
            const url = p.image_url.url;
            const m = url.match(/^data:([^;]+);base64,(.*)$/);
            if (m) {
              return { inlineData: { mimeType: m[1], data: m[2] } };
            }
            return { text: `[Image URL] ${url}` };
          }
          if (p.type === "file") {
            if (p.mime.startsWith("image/")) {
              return { inlineData: { mimeType: p.mime, data: p.data } };
            }
            return {
              text: `[Attached file: ${p.name} (${p.mime})]\n\`\`\`\n${(p.textPreview ?? "").slice(0, 6000)}\n\`\`\``,
            };
          }
          return null;
        })
        .filter(Boolean);
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });
}

function formatBytes(b64: string): string {
  // Rough estimate of decoded size from base64 length.
  const bytes = Math.floor(b64.length * 0.75);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function extractSystem(messages: ChatMessage[]): string | undefined {
  const sys = messages.find((m) => m.role === "system");
  if (!sys) return undefined;
  if (typeof sys.content === "string") return sys.content;
  return sys.content
    .filter((p): p is TextContentPart => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

async function* streamOpenAICompatible(opts: ProviderCall): AsyncGenerator<string, void, void> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const a = opts.advanced;
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: toOpenAIMessages(opts.messages, !!opts.supportsVision),
    stream: a?.streamEnabled !== false,
    ...(typeof opts.temperature === "number" ? { temperature: opts.temperature } : {}),
  };
  if (a?.topP !== undefined && a.topP < 1) body.top_p = a.topP;
  if (a?.presencePenalty) body.presence_penalty = a.presencePenalty;
  if (a?.frequencyPenalty) body.frequency_penalty = a.frequencyPenalty;
  if (a?.maxTokens && a.maxTokens > 0) body.max_tokens = a.maxTokens;
  if (a?.seed !== undefined) body.seed = a.seed;
  if (a?.reasoningEffort) body.reasoning_effort = a.reasoningEffort;
  if (a?.jsonMode) body.response_format = { type: "json_object" };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.apiKey}`,
    "Content-Type": "application/json",
  };
  if (opts.customHeaders) {
    for (const h of opts.customHeaders) {
      if (h.key && h.value) headers[h.key] = h.value;
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new HttpError(res.status, await res.text());
  yield* parseSSEText(res.body, (data) => {
    const json = JSON.parse(data);
    return json.choices?.[0]?.delta?.content ?? "";
  });
}

async function* streamAnthropic(opts: ProviderCall): AsyncGenerator<string, void, void> {
  const system = opts.advanced?.systemPromptOverride ?? extractSystem(opts.messages);
  const convo = toAnthropicMessages(opts.messages);
  const a = opts.advanced;
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: a?.maxTokens && a.maxTokens > 0 ? a.maxTokens : 4096,
    messages: convo,
    ...(system ? { system } : {}),
    stream: a?.streamEnabled !== false,
    ...(typeof opts.temperature === "number" ? { temperature: opts.temperature } : {}),
  };
  if (a?.topP !== undefined && a.topP < 1) body.top_p = a.topP;
  if (a?.reasoningEffort) {
    // Map to Anthropic extended thinking
    body.thinking = { type: "enabled", budget_tokens: a.reasoningEffort === "xhigh" ? 8192 : a.reasoningEffort === "high" ? 4096 : a.reasoningEffort === "medium" ? 2048 : 1024 };
  }

  const headers: Record<string, string> = {
    "x-api-key": opts.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "content-type": "application/json",
  };
  if (opts.customHeaders) {
    for (const h of opts.customHeaders) {
      if (h.key && h.value) headers[h.key] = h.value;
    }
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new HttpError(res.status, await res.text());
  yield* parseSSEText(res.body, (data) => {
    const json = JSON.parse(data);
    if (json.type === "content_block_delta" && typeof json.delta?.text === "string") {
      return json.delta.text;
    }
    return "";
  });
}

async function* streamGemini(opts: ProviderCall): AsyncGenerator<string, void, void> {
  const system = extractSystem(opts.messages);
  const convo = toGeminiMessages(opts.messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    opts.model
  )}:streamGenerateContent?alt=sse`;
  const body: Record<string, unknown> = {
    contents: convo,
    ...(typeof opts.temperature === "number"
      ? { generationConfig: { temperature: opts.temperature } }
      : {}),
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": opts.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new HttpError(res.status, await res.text());
  yield* parseSSEText(res.body, (data) => {
    const json = JSON.parse(data);
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  });
}

async function* parseSSEText(
  body: ReadableStream<Uint8Array>,
  extract: (data: string) => string
): AsyncGenerator<string, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const piece = extract(payload);
        if (piece) yield piece;
      } catch {
        // ignore malformed chunk, keep streaming
      }
    }
  }
}

function streamProvider(
  resolved: ResolvedProvider,
  messages: ChatMessage[],
  options: { signal?: AbortSignal; temperature?: number } = {}
): AsyncGenerator<string, void, void> {
  const advanced = getAdvanced(resolved.info.id);
  const call: ProviderCall = {
    baseUrl: resolved.baseUrl,
    apiKey: resolved.apiKey,
    model: resolved.model,
    messages,
    signal: options.signal,
    temperature: options.temperature ?? advanced.temperature,
    supportsVision: resolved.info.supports_vision,
    advanced,
    customHeaders: advanced.customHeaders,
  };
  switch (resolved.info.id) {
    case "anthropic":
      return streamAnthropic(call);
    case "gemini":
      return streamGemini(call);
    case "openai":
    case "deepseek":
    case "openrouter":
    case "qwen":
    case "custom":
    default:
      return streamOpenAICompatible(call);
  }
}

// ---------- Public streamChat ----------

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<ChatStreamEvent, void, void> {
  const configured = PROVIDER_CATALOG.filter((p) => isProviderConfigured(p.id))
    .map((p) => resolveProvider(p.id))
    .filter((p): p is ResolvedProvider => Boolean(p));

  if (configured.length === 0) {
    yield { type: "error", message: "No providers configured — open Settings and add an API key." };
    return;
  }

  const wantCouncil = options.council !== false && configured.length >= 2;
  const agentMode = !!options.agentMode;

  const throwIfAborted = () => {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
  };

  if (!wantCouncil) {
    const target =
      configured.find((p) => p.info.id === options.provider) ?? configured[0]!;
    if (agentMode) {
      yield { type: "stage", stage: "planning" };
      yield {
        type: "plan",
        steps: [
          "Understand the question and any attached context",
          "Decide which tools (if any) would help answer it",
          "Call tools and incorporate their results",
          "Synthesize a final, cited answer",
        ],
      };
    }
    yield { type: "stage", stage: "investigating" };
    const messages = withSystemAndContext([SINGLE_PROVIDER_PROMPT], options);
    let completionText = "";
    let pendingTools: ToolCall[] = [];
    let visibleYieldedLen = 0;
    try {
      for await (const chunk of streamProvider(target, messages, { signal: options.signal, temperature: options.temperature })) {
        throwIfAborted();
        completionText += chunk;
        if (agentMode) {
          const calls = extractToolCalls(completionText);
          if (calls.length > pendingTools.length) {
            const fresh = calls.slice(pendingTools.length);
            for (const c of fresh) {
              pendingTools.push(c);
              yield {
                type: "tool_call",
                id: c.id,
                tool: c.name,
                arguments: c.arguments,
                status: "pending",
              };
              yield { type: "stage", stage: "tool_call", detail: c.name };
              const start = performance.now();
              const out = await executeTool(c, options.signal);
              const durationMs = Math.round(performance.now() - start);
              yield {
                type: "tool_call",
                id: c.id,
                tool: c.name,
                arguments: c.arguments,
                status: out.error ? "error" : "success",
                result: out.result,
                error: out.error,
                durationMs,
              };
              throwIfAborted();
            }
          }
          const visibleText = stripToolJson(completionText);
          if (visibleText.length > visibleYieldedLen) {
            yield { type: "text", content: visibleText.slice(visibleYieldedLen) };
            visibleYieldedLen = visibleText.length;
          }
        } else {
          yield { type: "text", content: chunk };
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      yield { type: "error", message: errorMessage(err) };
      return;
    }
    const promptTokens = estimateMessageTokens(messages);
    const completionTokens = estimateTokens(completionText);
    yield usageEvent(target.info.shortName, target.model, promptTokens, completionTokens);
    yield { type: "stage", stage: "done" };
    return;
  }

  // Council mode
  if (agentMode) {
    yield { type: "stage", stage: "planning" };
    yield {
      type: "plan",
      steps: [
        "Distribute question across all configured LLMs",
        "Each council member investigates in parallel",
        "Judge model reviews all opinions",
        "Synthesize the final answer with disagreements called out",
      ],
    };
  }
  yield { type: "stage", stage: "investigating" };

  const councilMessages = withSystemAndContext([COUNCIL_MEMBER_PROMPT], options);

  const settled = await Promise.allSettled(
    configured.map((p) => collectStream(p, councilMessages, { signal: options.signal, temperature: options.temperature }))
  );

  if (options.signal?.aborted) return;

  const votes: CouncilVote[] = [];
  // Emit usage for each council member's vote
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    const provider = configured[i]!;
    if (result.status !== "fulfilled") continue;
    const opinion = extractOpinion(result.value);
    if (opinion) {
      votes.push({ model: provider.info.shortName, opinion });
      const promptTokens = estimateMessageTokens(councilMessages);
      const completionTokens = estimateTokens(result.value);
      yield usageEvent(provider.info.shortName, provider.model, promptTokens, completionTokens);
    }
  }

  if (votes.length === 0) {
    yield {
      type: "error",
      message: "Every council member failed — check your API keys and try again.",
    };
    return;
  }

  yield { type: "votes", votes };
  yield { type: "stage", stage: "synthesizing" };

  const judge =
    configured.find((p) => p.info.id === options.provider) ?? configured[0]!;

  const synthesisMessages = withSystemAndContext([SYNTHESIS_PROMPT], options, {
    extraUser: `Council opinions:\n${votes
      .map((v, i) => `${i + 1}. ${v.model}: ${v.opinion}`)
      .join("\n")}\n\nWrite the consensus response.`,
  });

  let completionText = "";
  try {
    for await (const chunk of streamProvider(judge, synthesisMessages, { signal: options.signal, temperature: options.temperature })) {
      throwIfAborted();
      completionText += chunk;
      yield { type: "text", content: chunk };
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    yield { type: "error", message: errorMessage(err) };
    return;
  }
  const promptTokens = estimateMessageTokens(synthesisMessages);
  const completionTokens = estimateTokens(completionText);
  yield usageEvent(judge.info.shortName, judge.model, promptTokens, completionTokens);

  yield { type: "stage", stage: "done" };
}

function withSystemAndContext(
  systemParts: string[],
  options: StreamChatOptions,
  extras: { extraUser?: string } = {}
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const personaPrompt = options.personaPrompt?.trim();
  const customProviderPrompt =
    options.provider && options.customSystemPrompts?.[options.provider]?.trim();
  // Pull in cross-session memory if available (client-side localStorage)
  let memoryPrompt = "";
  if (typeof window !== "undefined") {
    try {
      const mem = window.localStorage.getItem("nurovia-ai-memory");
      if (mem) {
        const facts = JSON.parse(mem) as Array<{ text: string; category: string }>;
        if (Array.isArray(facts) && facts.length > 0) {
          const grouped = facts.reduce<Record<string, Array<{ text: string }>>>((acc, f) => {
            (acc[f.category] = acc[f.category] || []).push(f);
            return acc;
          }, {});
          const sections: string[] = [];
          if (grouped.context?.length) {
            sections.push(`User context:\n${grouped.context.map((f) => `- ${f.text}`).join("\n")}`);
          }
          if (grouped.preference?.length) {
            sections.push(`User preferences:\n${grouped.preference.map((f) => `- ${f.text}`).join("\n")}`);
          }
          if (grouped.fact?.length) {
            sections.push(`Known facts:\n${grouped.fact.map((f) => `- ${f.text}`).join("\n")}`);
          }
          if (grouped.goal?.length) {
            sections.push(`User goals:\n${grouped.goal.map((f) => `- ${f.text}`).join("\n")}`);
          }
          if (sections.length > 0) {
            memoryPrompt = `[Long-term memory]\n${sections.join("\n\n")}`;
          }
        }
      }
    } catch {
      // ignore
    }
  }
  const combinedSystem = [
    memoryPrompt,
    personaPrompt,
    customProviderPrompt,
    options.agentMode ? toolsAsSystemPrompt() : "",
    ...systemParts.filter(Boolean),
  ]
    .filter(Boolean)
    .join("\n\n");
  if (combinedSystem) messages.push({ role: "system", content: combinedSystem });
  for (const m of options.messages) {
    if (m.role === "system") continue;
    messages.push(m);
  }
  if (options.context && options.context.trim()) {
    messages.push({
      role: "system",
      content: `Code context provided by the user:\n\`\`\`\n${options.context.trim()}\n\`\`\``,
    });
  }
  if (extras.extraUser) {
    messages.push({ role: "user", content: extras.extraUser });
  }
  return messages;
}

async function collectStream(
  resolved: ResolvedProvider,
  messages: ChatMessage[],
  options: { signal?: AbortSignal; temperature?: number } = {}
): Promise<string> {
  let acc = "";
  for await (const chunk of streamProvider(resolved, messages, options)) {
    acc += chunk;
  }
  return acc;
}

function extractOpinion(raw: string): string {
  if (!raw) return "";
  // Prefer the FIX line if present; it's the actionable summary.
  const fixMatch = raw.match(/(?:^|\n)\s*FIX\s*:\s*([^\n]+)/i);
  if (fixMatch) return fixMatch[1].trim().replace(/^`+|`+$/g, "").slice(0, 220);
  const diagMatch = raw.match(/(?:^|\n)\s*DIAGNOSIS\s*:\s*([^\n]+)/i);
  if (diagMatch) return diagMatch[1].trim().replace(/^`+|`+$/g, "").slice(0, 220);
  return raw.trim().replace(/\s+/g, " ").slice(0, 220);
}

function errorMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

/**
 * Parse out ```json { tool: ..., arguments: {...} } ``` blocks from streamed LLM text.
 * Returns one ToolCall per block in document order.
 */
function extractToolCalls(text: string): ToolCall[] {
  const out: ToolCall[] = [];
  const re = /```json\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  let counter = 0;
  while ((m = re.exec(text)) !== null) {
    const body = (m[1] ?? "").trim();
    try {
      const parsed = JSON.parse(body) as { tool?: string; arguments?: Record<string, unknown> };
      if (parsed && typeof parsed.tool === "string" && parsed.arguments && typeof parsed.arguments === "object") {
        out.push({
          id: `tc_${Date.now().toString(36)}_${counter++}`,
          name: parsed.tool,
          arguments: parsed.arguments,
        });
      }
    } catch {
      // not a tool call, ignore
    }
  }
  return out;
}

/**
 * Strip ```json ... ``` blocks from streamed text so they don't show up in the
 * chat bubble — tool output is rendered separately as a card.
 */
function stripToolJson(text: string): string {
  return text.replace(/```json\s*[\s\S]*?```/g, "").trimEnd();
}