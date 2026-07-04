/**
 * User-uploaded documents store. Simple in-browser RAG:
 * - Files are stored as base64 in localStorage (with a size cap).
 * - On retrieval, simple keyword matching finds relevant chunks.
 * - In production, replace with vector embeddings + cosine similarity (e.g., Transformers.js).
 */

const STORAGE_KEY = "nurovia-ai-user-docs";
const CHUNK_SIZE = 800; // characters
const MAX_DOC_BYTES = 4 * 1024 * 1024; // 4MB per doc
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

export interface UserDoc {
  id: string;
  name: string;
  mime: string;
  size: number;
  uploadedAt: string;
  chunks: string[]; // pre-chunked text
}

function readAll(): UserDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserDoc[];
  } catch {
    return [];
  }
}

function writeAll(list: UserDoc[]) {
  try {
    const json = JSON.stringify(list);
    if (json.length > MAX_TOTAL_BYTES) {
      throw new Error("Total docs storage exceeded");
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.warn("Failed to save docs", err);
  }
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export async function addDoc(file: File): Promise<UserDoc> {
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_DOC_BYTES / 1024 / 1024)} MB)`);
  }
  let text = "";
  if (file.type.startsWith("text/") || /\.(md|txt|json|csv|ya?ml|ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|hpp|cs|rb|php|sh|sql|html|css|scss)$/i.test(file.name)) {
    text = await file.text();
  } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    // Best-effort: read as text (will be garbage for binary PDFs but won't crash)
    text = await file.text();
  } else {
    text = `(binary file: ${file.name}, ${file.type}, ${file.size} bytes)`;
  }
  const doc: UserDoc = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
    chunks: chunkText(text),
  };
  const all = readAll();
  all.push(doc);
  writeAll(all);
  return doc;
}

export function removeDoc(id: string) {
  writeAll(readAll().filter((d) => d.id !== id));
}

export function listDocs(): UserDoc[] {
  return readAll();
}

/**
 * Simple RAG retrieval — score each chunk by keyword overlap, return top N.
 */
export function retrieveDocs(query: string, limit = 3): Array<{ docName: string; chunk: string; score: number }> {
  const all = readAll();
  if (all.length === 0 || !query.trim()) return [];
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (q.length === 0) return [];
  const hits: Array<{ docName: string; chunk: string; score: number }> = [];
  for (const doc of all) {
    for (const chunk of doc.chunks) {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const term of q) {
        const occurrences = (lower.match(new RegExp(escapeRegex(term), "g")) ?? []).length;
        score += occurrences;
      }
      if (score > 0) hits.push({ docName: doc.name, chunk, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function docsAsSystemPrompt(query: string): string {
  const hits = retrieveDocs(query, 3);
  if (hits.length === 0) return "";
  const parts: string[] = ["[Relevant excerpts from user docs]"];
  for (const hit of hits) {
    parts.push(`--- ${hit.docName} (score ${hit.score}) ---\n${hit.chunk}`);
  }
  return parts.join("\n\n");
}