/**
 * Model capability registry. Pure data, no network.
 * Used by Settings UI to show context window, cost, capability badges.
 *
 * Numbers are public list prices (USD per 1M tokens). Update when providers
 * change pricing or when new models launch.
 */

export interface ModelCapability {
  contextWindow: number;
  inputPer1M: number;
  outputPer1M: number;
  vision: boolean;
  tools: boolean;
  audio: boolean;
  reasoning: boolean;
  streaming: boolean;
  json: boolean;
  knowledge: string; // e.g. "Sep 2024"
  notes?: string;
}

const DEEPSEEK_V3: ModelCapability = {
  contextWindow: 65_536,
  inputPer1M: 0.27,
  outputPer1M: 1.1,
  vision: false,
  tools: true,
  audio: false,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Jul 2024",
};

const CLAUDE_HAIKU_45: ModelCapability = {
  contextWindow: 200_000,
  inputPer1M: 1.0,
  outputPer1M: 5.0,
  vision: true,
  tools: true,
  audio: false,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Jul 2024",
};

const CLAUDE_SONNET_45: ModelCapability = {
  contextWindow: 200_000,
  inputPer1M: 3.0,
  outputPer1M: 15.0,
  vision: true,
  tools: true,
  audio: false,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Jan 2025",
};

const CLAUDE_OPUS: ModelCapability = {
  contextWindow: 200_000,
  inputPer1M: 15.0,
  outputPer1M: 75.0,
  vision: true,
  tools: true,
  audio: false,
  reasoning: true,
  streaming: true,
  json: true,
  knowledge: "Aug 2024",
};

const GPT4O_MINI: ModelCapability = {
  contextWindow: 128_000,
  inputPer1M: 0.15,
  outputPer1M: 0.6,
  vision: true,
  tools: true,
  audio: true,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Oct 2023",
};

const GPT4O: ModelCapability = {
  contextWindow: 128_000,
  inputPer1M: 2.5,
  outputPer1M: 10,
  vision: true,
  tools: true,
  audio: true,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Oct 2023",
};

const O1: ModelCapability = {
  contextWindow: 200_000,
  inputPer1M: 15,
  outputPer1M: 60,
  vision: true,
  tools: true,
  audio: false,
  reasoning: true,
  streaming: true,
  json: false,
  knowledge: "Oct 2023",
  notes: "Reasoning model — slowest, most accurate. No JSON/system-message support.",
};

const O3_MINI: ModelCapability = {
  contextWindow: 200_000,
  inputPer1M: 1.1,
  outputPer1M: 4.4,
  vision: false,
  tools: true,
  audio: false,
  reasoning: true,
  streaming: true,
  json: false,
  knowledge: "Oct 2023",
  notes: "Cheap reasoning model. JSON unsupported in mid-tier.",
};

const GEMINI_25_FLASH: ModelCapability = {
  contextWindow: 1_000_000,
  inputPer1M: 0.075,
  outputPer1M: 0.3,
  vision: true,
  tools: true,
  audio: true,
  reasoning: false,
  streaming: true,
  json: true,
  knowledge: "Sep 2024",
};

const GEMINI_25_PRO: ModelCapability = {
  contextWindow: 1_000_000,
  inputPer1M: 1.25,
  outputPer1M: 5.0,
  vision: true,
  tools: true,
  audio: true,
  reasoning: true,
  streaming: true,
  json: true,
  knowledge: "Sep 2024",
};

const QWEN3_MAX: ModelCapability = {
  contextWindow: 262_144,
  inputPer1M: 0.7,
  outputPer1M: 2.8,
  vision: true,
  tools: true,
  audio: false,
  reasoning: true,
  streaming: true,
  json: true,
  knowledge: "Sep 2024",
  notes: "DashScope. OpenAI-compatible endpoint at /compatible-mode/v1.",
};

const QWEN3_PLUS: ModelCapability = {
  contextWindow: 131_072,
  inputPer1M: 0.4,
  outputPer1M: 1.2,
  vision: true,
  tools: true,
  audio: false,
  reasoning: true,
  streaming: true,
  json: true,
  knowledge: "Sep 2024",
};

const LLAMA3_70B: ModelCapability = {
  contextWindow: 8_192,
  inputPer1M: 0.0,
  outputPer1M: 0.0,
  vision: false,
  tools: false,
  audio: false,
  reasoning: false,
  streaming: true,
  json: false,
  knowledge: "Dec 2023",
  notes: "Free via OpenRouter. Context varies by provider.",
};

/** Curated registry — keyed by model id */
export const MODEL_REGISTRY: Record<string, ModelCapability> = {
  // Anthropic
  "claude-3-5-haiku-20241022": CLAUDE_HAIKU_45,
  "claude-3-5-haiku-latest": CLAUDE_HAIKU_45,
  "claude-3-5-sonnet-20241022": CLAUDE_SONNET_45,
  "claude-3-5-sonnet-latest": CLAUDE_SONNET_45,
  "claude-3-opus-20240229": CLAUDE_OPUS,
  "claude-opus-4-20250514": CLAUDE_OPUS,
  // OpenAI
  "gpt-4o-mini": GPT4O_MINI,
  "gpt-4o": GPT4O,
  "gpt-4o-2024-08-06": GPT4O,
  "gpt-4-turbo": { ...GPT4O, contextWindow: 128_000, inputPer1M: 10, outputPer1M: 30 },
  "o1-preview": O1,
  "o1-mini": { ...O1, inputPer1M: 3, outputPer1M: 12 },
  "o1": O1,
  "o3-mini": O3_MINI,
  // Google
  "gemini-2.0-flash-exp": GEMINI_25_FLASH,
  "gemini-1.5-flash": { ...GEMINI_25_FLASH, contextWindow: 1_000_000 },
  "gemini-1.5-pro": GEMINI_25_PRO,
  "gemini-2.5-pro": GEMINI_25_PRO,
  // DeepSeek
  "deepseek-chat": { ...DEEPSEEK_V3, notes: "DeepSeek-V3 chat. Cheapest frontier model." },
  "deepseek-reasoner": { ...DEEPSEEK_V3, inputPer1M: 0.55, outputPer1M: 2.19, reasoning: true, json: false },
  "deepseek-coder": { ...DEEPSEEK_V3, notes: "DeepSeek-Coder fine-tuned for code." },
  // Qwen (DashScope)
  "qwen3-max": QWEN3_MAX,
  "qwen-max": QWEN3_MAX,
  "qwen3.7-plus": QWEN3_PLUS,
  "qwen-plus": QWEN3_PLUS,
  "qwen-turbo": { ...QWEN3_PLUS, contextWindow: 1_000_000, inputPer1M: 0.05, outputPer1M: 0.4 },
  // OpenRouter pass-throughs
  "meta-llama/llama-3.1-70b-instruct": LLAMA3_70B,
  "meta-llama/llama-3.1-405b-instruct": { ...LLAMA3_70B, inputPer1M: 2, outputPer1M: 2, notes: "Best open model. 405B params." },
  "mistralai/mistral-large-latest": { ...LLAMA3_70B, contextWindow: 128_000, inputPer1M: 2, outputPer1M: 6 },
};

/**
 * Auto-detect capabilities from a model name. Used for new/unknown models so the
 * UI still shows reasonable hints instead of "unknown".
 */
export function detectCapabilities(modelId: string): ModelCapability {
  // Exact match wins
  if (MODEL_REGISTRY[modelId]) return MODEL_REGISTRY[modelId];

  const m = modelId.toLowerCase();
  const cap: ModelCapability = {
    contextWindow: 32_768,
    inputPer1M: 1.0,
    outputPer1M: 3.0,
    vision: false,
    tools: false,
    audio: false,
    reasoning: false,
    streaming: true,
    json: true,
    knowledge: "Unknown",
  };

  if (/vision|gpt-4o|gemini|qwen.*vl|claude-3|claude-opus/.test(m)) cap.vision = true;
  if (/^(o1|o3|deepseek-reasoner|qwq|qwen.*reasoning|gemini.*thinking|gemini-2\.5-pro)/.test(m)) cap.reasoning = true;
  if (/gpt-4|claude-3|qwen-|deepseek|mistral|gemini|llama|command-r/.test(m)) cap.tools = true;
  if (/tts|whisper|audio|realtime/.test(m)) cap.audio = true;
  if (/opus|gpt-4|sonnet|max|pro/.test(m)) cap.contextWindow = 200_000;
  if (/haiku|mini|flash|turbo|nano|small/.test(m)) cap.inputPer1M = 0.15;
  return cap;
}

export function getCapability(modelId?: string): ModelCapability {
  if (!modelId) {
    return {
      contextWindow: 0,
      inputPer1M: 0,
      outputPer1M: 0,
      vision: false,
      tools: false,
      audio: false,
      reasoning: false,
      streaming: false,
      json: false,
      knowledge: "Pick a model",
    };
  }
  return detectCapabilities(modelId);
}

export function listKnownModels(providerId: string): ModelCapability[] {
  const seen = new Set<string>();
  const list: Array<{ id: string; cap: ModelCapability }> = [];
  for (const [id, cap] of Object.entries(MODEL_REGISTRY)) {
    // Naive provider routing; the provider metadata file has the authoritative list
    if (providerId === "openai" && (id.startsWith("gpt") || id.startsWith("o1") || id.startsWith("o3"))) {
      if (!seen.has(id)) { seen.add(id); list.push({ id, cap }); }
    } else if (providerId === "anthropic" && id.startsWith("claude")) {
      if (!seen.has(id)) { seen.add(id); list.push({ id, cap }); }
    } else if (providerId === "gemini" && id.startsWith("gemini")) {
      if (!seen.has(id)) { seen.add(id); list.push({ id, cap }); }
    } else if (providerId === "deepseek" && id.startsWith("deepseek")) {
      if (!seen.has(id)) { seen.add(id); list.push({ id, cap }); }
    } else if (providerId === "qwen" && (id.startsWith("qwen") || id.startsWith("qwen3") || id.startsWith("qwq"))) {
      if (!seen.has(id)) { seen.add(id); list.push({ id, cap }); }
    }
  }
  return list.map((x) => ({ ...x.cap }));
}