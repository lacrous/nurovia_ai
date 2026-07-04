/**
 * Autosave + restore draft text per session. Stored in localStorage so they survive page reloads.
 */
const DRAFT_KEY = "nurovia-ai-drafts";

type DraftMap = Record<string, string>;

function readDrafts(): DraftMap {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DraftMap;
  } catch {
    return {};
  }
}

function writeDrafts(map: DraftMap) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function saveDraft(sessionId: string, text: string) {
  if (!sessionId) return;
  const map = readDrafts();
  if (text.trim()) {
    map[sessionId] = text;
  } else {
    delete map[sessionId];
  }
  writeDrafts(map);
}

export function getDraft(sessionId: string): string {
  if (!sessionId) return "";
  return readDrafts()[sessionId] ?? "";
}

export function clearDraft(sessionId: string) {
  if (!sessionId) return;
  const map = readDrafts();
  delete map[sessionId];
  writeDrafts(map);
}