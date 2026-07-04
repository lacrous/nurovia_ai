/**
 * Cross-session memory — facts the user wants the council to remember.
 * Stored as a flat list of bullet points; the active session's system prompt gets prepended with these.
 */

export interface MemoryFact {
  id: string;
  text: string;
  category: "preference" | "context" | "fact" | "goal";
  createdAt: string;
  source?: "manual" | "auto";
}

const MEMORY_KEY = "nurovia-ai-memory";

function readMemory(): MemoryFact[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MemoryFact[];
  } catch {
    return [];
  }
}

function writeMemory(list: MemoryFact[]) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getMemory(): MemoryFact[] {
  return readMemory();
}

export function addFact(text: string, category: MemoryFact["category"] = "context"): MemoryFact {
  const fact: MemoryFact = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    category,
    createdAt: new Date().toISOString(),
    source: "manual",
  };
  const list = [...readMemory(), fact];
  writeMemory(list);
  return fact;
}

export function removeFact(id: string) {
  const list = readMemory().filter((f) => f.id !== id);
  writeMemory(list);
}

export function updateFact(id: string, text: string) {
  const list = readMemory().map((f) => (f.id === id ? { ...f, text: text.trim() } : f));
  writeMemory(list);
}

export function clearMemory() {
  writeMemory([]);
}

/**
 * Render memory as a system prompt section for council members.
 */
export function memoryAsSystemPrompt(): string {
  const facts = readMemory();
  if (facts.length === 0) return "";
  const grouped = facts.reduce<Record<string, MemoryFact[]>>((acc, f) => {
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
  return `[Long-term memory]\n${sections.join("\n\n")}`;
}