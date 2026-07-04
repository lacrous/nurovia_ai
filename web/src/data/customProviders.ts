/**
 * Custom model providers — connect to local OpenAI-compatible servers
 * (LM Studio, Ollama, vLLM, llama.cpp, text-generation-webui, etc.)
 * Stored locally. Each provider gets its own URL + optional API key + selected models.
 */

const STORAGE_KEY = "nurovia-ai-custom-providers";

export interface CustomProvider {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
}

function readAll(): CustomProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomProvider[];
  } catch {
    return [];
  }
}

function writeAll(list: CustomProvider[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function listCustomProviders(): CustomProvider[] {
  return readAll();
}

export function addCustomProvider(p: Omit<CustomProvider, "id">): CustomProvider {
  const created: CustomProvider = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  writeAll([...readAll(), created]);
  return created;
}

export function updateCustomProvider(id: string, patch: Partial<CustomProvider>) {
  writeAll(readAll().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export function removeCustomProvider(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function fetchCustomModels(id: string): Promise<string[]> {
  const p = readAll().find((x) => x.id === id);
  if (!p) return Promise.resolve([]);
  return fetch(`${p.baseUrl.replace(/\/$/, "")}/v1/models`, {
    headers: p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {},
  })
    .then((r) => r.json())
    .then((data) => (data?.data ?? []).map((m: { id: string }) => m.id))
    .catch(() => []);
}