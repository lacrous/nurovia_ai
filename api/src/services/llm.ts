/**
 * LLM relay — fetches tokens from upstream providers and re-streams as SSE.
 */
export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter"
  | "qwen"
  | "moonshot"
  | "nvidia"
  | "grok"
  | "mistral"
  | "custom";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

export interface ChatRequest {
  provider: Provider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface StreamEvent {
  type: "token" | "tool_call" | "usage" | "done" | "error";
  data: Record<string, unknown>;
}

const PROVIDER_URLS: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  deepseek: "https://api.deepseek.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  moonshot: "https://api.moonshot.cn/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
  grok: "https://api.x.ai/v1",
  mistral: "https://api.mistral.ai/v1",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
  custom: "",
};

export function getProviderBaseUrl(provider: Provider, baseUrl?: string): string {
  if (provider === "custom") {
    if (!baseUrl) throw new Error("Custom provider requires baseUrl");
    return baseUrl.replace(/\/+$/, "");
  }
  return PROVIDER_URLS[provider];
}

export async function* streamChat(req: ChatRequest): AsyncGenerator<StreamEvent> {
  if (req.provider === "anthropic") {
    yield* streamAnthropic(req);
  } else if (req.provider === "google") {
    yield* streamGoogle(req);
  } else {
    yield* streamOpenAICompatible(req);
  }
}

async function* streamOpenAICompatible(req: ChatRequest): AsyncGenerator<StreamEvent> {
  const baseUrl = getProviderBaseUrl(req.provider, req.baseUrl);
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: req.model,
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: req.temperature,
    top_p: req.topP,
    max_tokens: req.maxTokens,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${req.apiKey}` },
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    yield { type: "error", data: { code: `http_${res.status}`, message: text || res.statusText } };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        yield { type: "done", data: {} };
        return;
      }
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield { type: "token", data: { text: delta } };
        if (json.usage) {
          yield {
            type: "usage",
            data: { promptTokens: json.usage.prompt_tokens ?? 0, completionTokens: json.usage.completion_tokens ?? 0 },
          };
        }
      } catch {
        // ignore malformed
      }
    }
  }
  yield { type: "done", data: {} };
}

async function* streamAnthropic(req: ChatRequest): AsyncGenerator<StreamEvent> {
  const url = "https://api.anthropic.com/v1/messages";
  const systemMsg = req.messages.find((m) => m.role === "system");
  const userMessages = req.messages.filter((m) => m.role !== "system");
  const body = {
    model: req.model,
    max_tokens: req.maxTokens ?? 1024,
    temperature: req.temperature,
    top_p: req.topP,
    system: systemMsg?.content,
    messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": req.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    yield { type: "error", data: { code: `http_${res.status}`, message: text || res.statusText } };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      try {
        const json = JSON.parse(data);
        if (json.type === "content_block_delta" && json.delta?.text) {
          yield { type: "token", data: { text: json.delta.text } };
        } else if (json.type === "message_start" && json.message?.usage) {
          yield {
            type: "usage",
            data: { promptTokens: json.message.usage.input_tokens ?? 0, completionTokens: 0 },
          };
        } else if (json.type === "message_delta" && json.usage) {
          yield { type: "usage", data: { completionTokens: json.usage.output_tokens ?? 0 } };
        }
      } catch {
        // ignore
      }
    }
  }
  yield { type: "done", data: {} };
}

async function* streamGoogle(req: ChatRequest): AsyncGenerator<StreamEvent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:streamGenerateContent?key=${req.apiKey}&alt=sse`;
  const contents = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const systemInstruction = req.messages.find((m) => m.role === "system")?.content;
  const body: Record<string, unknown> = { contents };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  if (req.temperature !== undefined || req.topP !== undefined || req.maxTokens !== undefined) {
    body.generationConfig = { temperature: req.temperature, topP: req.topP, maxOutputTokens: req.maxTokens };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    yield { type: "error", data: { code: `http_${res.status}`, message: text || res.statusText } };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      try {
        const json = JSON.parse(data);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield { type: "token", data: { text } };
      } catch {
        // ignore
      }
    }
  }
  yield { type: "done", data: {} };
}

export function eventToSse(evt: StreamEvent): string {
  return `event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`;
}