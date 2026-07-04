export interface Workspace {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

const WORKSPACES_KEY = "nurovia-ai-workspaces";
const ACTIVE_WORKSPACE_KEY = "nurovia-ai-active-workspace";

function readWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Workspace[];
  } catch {
    return [];
  }
}

function writeWorkspaces(list: Workspace[]) {
  try {
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getWorkspaces(): Workspace[] {
  let list = readWorkspaces();
  if (list.length === 0) {
    list = [makeDefault()];
    writeWorkspaces(list);
  }
  return list;
}

function makeDefault(): Workspace {
  return {
    id: "default",
    name: "Personal",
    emoji: "🏠",
    createdAt: new Date().toISOString(),
  };
}

export function getActiveWorkspaceId(): string {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY) ?? "default";
  } catch {
    return "default";
  }
}

export function setActiveWorkspaceId(id: string) {
  try {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  } catch {
    // ignore
  }
  // Namespace session/settings per workspace
  try {
    const sessionsKey = `nurovia-ai-sessions-${id}`;
    const settingsKey = `nurovia-ai-settings-${id}`;
    const keysKey = `nurovia-ai-provider-keys-${id}`;
    // If the per-workspace key doesn't exist yet but a default does, copy it.
    if (!localStorage.getItem(sessionsKey) && localStorage.getItem("nurovia-ai-chat-sessions")) {
      const v = localStorage.getItem("nurovia-ai-chat-sessions");
      if (v) localStorage.setItem(sessionsKey, v);
    }
    if (!localStorage.getItem(settingsKey) && localStorage.getItem("nurovia-ai-settings")) {
      const v = localStorage.getItem("nurovia-ai-settings");
      if (v) localStorage.setItem(settingsKey, v);
    }
    if (!localStorage.getItem(keysKey) && localStorage.getItem("nurovia-ai-provider-keys")) {
      const v = localStorage.getItem("nurovia-ai-provider-keys");
      if (v) localStorage.setItem(keysKey, v);
    }
  } catch {
    // ignore
  }
}

export function createWorkspace(name: string, emoji = "✨"): Workspace {
  const ws: Workspace = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    emoji,
    createdAt: new Date().toISOString(),
  };
  const list = [...readWorkspaces(), ws];
  writeWorkspaces(list);
  return ws;
}

export function deleteWorkspace(id: string) {
  if (id === "default") return; // can't delete default
  const list = readWorkspaces().filter((w) => w.id !== id);
  writeWorkspaces(list);
  // Clean up namespaced keys
  try {
    localStorage.removeItem(`nurovia-ai-sessions-${id}`);
    localStorage.removeItem(`nurovia-ai-settings-${id}`);
    localStorage.removeItem(`nurovia-ai-provider-keys-${id}`);
  } catch {
    // ignore
  }
  if (getActiveWorkspaceId() === id) {
    setActiveWorkspaceId("default");
  }
}

export function renameWorkspace(id: string, name: string, emoji?: string) {
  const list = readWorkspaces().map((w) =>
    w.id === id ? { ...w, name, emoji: emoji ?? w.emoji } : w
  );
  writeWorkspaces(list);
}

export function workspaceStorageKeys(id: string) {
  return {
    sessions: `nurovia-ai-sessions-${id}`,
    settings: `nurovia-ai-settings-${id}`,
    keys: `nurovia-ai-provider-keys-${id}`,
  };
}