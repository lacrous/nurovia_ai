import { useEffect, useState } from "react";
import { ModalShell } from "./ModalShell";
import { useTheme, type Accent } from "../hooks/useTheme";
import { ProviderIconTile } from "./settings/ProviderIconTile";
import { ProviderDetailSheet } from "./settings/ProviderDetailSheet";
import {
  getCustomPersonas,
  addCustomPersona,
  deleteCustomPersona,
  setActivePersonaId as setActivePersonaKey,
  type Persona,
} from "../data/personas";
import {
  KeyRound,
  Trash2,
  Loader2,
  Download,
  Upload,
  Database,
  Settings as Cog,
  Sliders,
  Info,
  Sparkles,
  Zap,
  Plus,
  Brain,
} from "lucide-react";
import {
  fetchKeys,
  fetchProviders,
  fetchSettings,
  saveSettings,
  exportAll,
  importAll,
  clearAll,
  type AppSettings,
  type ProviderInfo,
  type ProviderKeyPublic,
} from "../services/api";
import { useToast } from "./ui";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

type Tab = "providers" | "defaults" | "commands" | "memory" | "data" | "about";

export function SettingsModal({ open, onClose, onChanged }: SettingsModalProps) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [keys, setKeys] = useState<ProviderKeyPublic[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([fetchProviders(), fetchKeys(), fetchSettings()])
      .then(([provs, k, s]) => {
        setProviders(provs);
        setKeys(k);
        setSettings(s);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, toast]);

  if (!open) return null;

  const refreshProviders = async () => {
    const [provs, k] = await Promise.all([fetchProviders(), fetchKeys()]);
    setProviders(provs);
    setKeys(k);
    onChanged();
  };

  const handlePersistSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
    // Sync to legacy keys so Chat.tsx picks up the change immediately.
    if (typeof next.persona === "string") {
      setActivePersonaKey(next.persona);
    }
    if (typeof next.councilAuto === "boolean") {
      try {
        localStorage.setItem("nurovia-ai-council-mode", String(next.councilAuto));
      } catch {
        // ignore
      }
    }
    // Notify the rest of the app (Chat, Dashboard, etc.) to re-fetch settings.
    try {
      window.dispatchEvent(new CustomEvent("nurovia-settings-changed", { detail: next }));
    } catch {
      // ignore
    }
  };

  const handleExportAll = async () => {
    try {
      const env = await exportAll();
      const blob = new Blob([JSON.stringify(env, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nurovia-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const env = JSON.parse(text);
      await importAll(env);
      toast.success("Import successful · reload to see sessions");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleImportChatGPT = async (file: File) => {
    try {
      const { importChatGPT } = await import("../services/api");
      const { imported, skipped } = await importChatGPT(file);
      toast.success(`Imported ${imported} chat${imported === 1 ? "" : "s"} from ChatGPT${skipped ? ` · ${skipped} skipped` : ""}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Erase all sessions, keys, and settings? This cannot be undone.")) return;
    await clearAll();
    toast.success("All local data cleared");
    onChanged();
    onClose();
  };

  const tabs: { id: Tab; label: string; icon: typeof Cog }[] = [
    { id: "providers", label: "Providers", icon: KeyRound },
    { id: "defaults", label: "Defaults", icon: Sliders },
    { id: "commands", label: "Commands", icon: Zap },
    { id: "memory", label: "Memory", icon: Brain },
    { id: "data", label: "Data", icon: Database },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      widthClass="max-w-3xl"
      topClass="pt-[8vh]"
      maxHeightClass="max-h-[84vh]"
      icon={<Cog className="w-4 h-4 text-gold" />}
      title="Settings"
    >

        <div className="flex shrink-0 border-b border-theme/20 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[13px]">Loading…</span>
            </div>
          ) : tab === "providers" ? (
            <ProvidersTab
              providers={providers}
              keys={keys}
              onSaved={refreshProviders}
            />
          ) : tab === "defaults" ? (
            <DefaultsTab settings={settings} onChange={handlePersistSettings} />
          ) : tab === "commands" ? (
            <CustomCommandsTab settings={settings} onChange={handlePersistSettings} />
          ) : tab === "memory" ? (
            <MemoryTab />
          ) : tab === "data" ? (
            <DataTab
              onExport={handleExportAll}
              onImport={handleImport}
              onImportChatGPT={handleImportChatGPT}
              onClear={handleClearAll}
            />
          ) : (
            <AboutTab />
          )}
        </div>
    </ModalShell>
  );
}

// ---------- Providers tab ----------

function ProvidersTab({
  providers,
  keys,
  onSaved,
}: {
  providers: ProviderInfo[];
  keys: ProviderKeyPublic[];
  onSaved: () => void | Promise<void>;
}) {
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const configured = providers.filter((p) => keys.some((k) => k.provider === p.id));
  const activeProvider = activeProviderId ? providers.find((p) => p.id === activeProviderId) ?? null : null;
  const activeStoredKey = activeProvider ? keys.find((k) => k.provider === activeProvider.id) : undefined;

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <div>
        <p className="text-[16px] font-semibold txt-head">Pick a provider to configure</p>
        <p className="text-[12.5px] txt-muted mt-1.5">
          Click any icon to enter your key and tweak advanced settings. Configure at least 2 to enable Council mode.
        </p>
        <div className="flex items-center gap-2 mt-3 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {configured.length} of {providers.length} active
          </div>
          {configured.length >= 2 ? (
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Council mode enabled
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Add {(2 - configured.length).toString()} more for Council
            </div>
          )}
        </div>
      </div>

      {/* Empty state — onboarding nudge */}
      {configured.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-5">
          <p className="text-[13px] font-semibold txt-head">Start with one provider</p>
          <p className="text-[12px] txt-muted mt-1 leading-relaxed">
            For solo work, OpenAI <span className="font-mono">gpt-4o-mini</span> or DeepSeek <span className="font-mono">deepseek-chat</span> are the cheapest reliable starts. For code work, Anthropic <span className="font-mono">claude-3-5-sonnet</span> is gold standard.
          </p>
        </div>
      )}

      {/* Icon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {providers.map((p) => (
          <ProviderIconTile
            key={p.id}
            provider={p}
            configured={!!keys.find((k) => k.provider === p.id)}
            onClick={() => setActiveProviderId(p.id)}
          />
        ))}
      </div>

      {/* Footnote */}
      <div className="rounded-xl border border-theme/20 bg-surface/40 p-3.5 text-[11.5px] txt-muted leading-relaxed">
        <p>
          <span className="font-semibold text-gold">Privacy:</span> All keys live in your browser's localStorage. Nurovia AI's servers never see them — every LLM call goes directly from your browser to the provider.
        </p>
      </div>

      {/* Detail sheet (opens on icon click) */}
      <ProviderDetailSheet
        provider={activeProvider}
        storedKey={activeStoredKey}
        onClose={() => setActiveProviderId(null)}
        onSaved={onSaved}
      />
    </div>
  );
}

// ---------- Defaults tab ----------

function DefaultsTab({
  settings,
  onChange,
}: {
  settings: AppSettings;
  onChange: (next: AppSettings) => void | Promise<void>;
}) {
  const temp = settings.temperature ?? 0.3;
  const { accent, setAccent } = useTheme();
  const accentPalette: { id: Accent; label: string; hsl: string; preview: string }[] = [
    { id: "gold", label: "Gold", hsl: "45 65% 52%", preview: "linear-gradient(135deg, #D4AF37, #E5C95A)" },
    { id: "blue", label: "Cobalt", hsl: "212 90% 58%", preview: "linear-gradient(135deg, #2E7BE6, #6AA9FF)" },
    { id: "emerald", label: "Emerald", hsl: "158 70% 48%", preview: "linear-gradient(135deg, #16A36A, #5BD09A)" },
    { id: "purple", label: "Iris", hsl: "268 70% 62%", preview: "linear-gradient(135deg, #7C3AED, #B084EE)" },
    { id: "rose", label: "Rose", hsl: "340 75% 58%", preview: "linear-gradient(135deg, #E0397A, #F47BAE)" },
  ];
  const [codeTheme, setCodeTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("nurovia-ai-code-theme") ?? "vsDark";
    } catch {
      return "vsDark";
    }
  });
  const updateCodeTheme = (t: string) => {
    try {
      localStorage.setItem("nurovia-ai-code-theme", t);
    } catch {
      // ignore
    }
    setCodeTheme(t);
  };
  const codeThemeSwatches: Record<string, string> = {
    vsDark: "#1e1e1e",
    dracula: "#282a36",
    nightOwl: "#011627",
    oceanicNext: "#1b2b34",
    palenight: "#292d3e",
    github: "#ffffff",
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold mb-1">Accent color</h3>
        <p className="text-[11px] txt-faint mb-2">Used for focus rings, primary buttons, highlights.</p>
        <div className="grid grid-cols-5 gap-2">
          {accentPalette.map((p) => (
            <button
              key={p.id}
              onClick={() => setAccent(p.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                accent === p.id ? "border-gold bg-gold/10" : "border-theme/20 bg-surface hover:border-theme/40"
              }`}
            >
              <span
                className="w-8 h-8 rounded-full border border-theme/30"
                style={{ background: p.preview }}
              />
              <span className="text-[10.5px] font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-[13px] font-semibold">Temperature</h3>
            <p className="text-[11px] txt-faint">Lower = more deterministic, higher = more creative</p>
          </div>
          <span className="font-mono text-[12px] text-gold">{temp.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={temp}
          onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="flex justify-between text-[10px] txt-faint mt-1">
          <span>0.00 · strict</span>
          <span>0.50 · balanced</span>
          <span>1.00 · wild</span>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold mb-2">Council behavior</h3>
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-theme/20 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.councilAuto !== false}
            onChange={(e) => onChange({ ...settings, councilAuto: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-theme/30 bg-background text-gold focus:ring-gold/20"
          />
          <div>
            <p className="text-[12.5px] font-medium">Auto-engage council when ≥2 providers are configured</p>
            <p className="text-[11px] txt-faint">Otherwise fan-out only happens when you toggle it on in the chat header.</p>
          </div>
        </label>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold mb-2">Code block theme</h3>
        <p className="text-[11px] txt-faint mb-2">Theme used to render code in chat responses.</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(codeThemeSwatches).map((k) => (
            <button
              key={k}
              onClick={() => updateCodeTheme(k)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-colors ${
                codeTheme === k
                  ? "border-gold bg-gold/10"
                  : "border-theme/20 bg-surface hover:border-gold/40"
              }`}
            >
              <span
                className="w-5 h-5 rounded-md border border-theme/30 shrink-0"
                style={{ background: codeThemeSwatches[k] }}
              />
              <span className="text-[11.5px] font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold mb-2">Persona</h3>
        <p className="text-[11px] txt-faint mb-2">Prepends a system prompt to every message. Pick a lens, or define your own.</p>
        <select
          value={settings.persona ?? "default"}
          onChange={(e) => onChange({ ...settings, persona: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-surface border border-theme/30 text-[13px] outline-none focus:border-gold/50"
        >
          <option value="default">✨ Default</option>
          <option value="senior-engineer">🧐 Senior engineer</option>
          <option value="junior-friendly">🎓 Explain to junior</option>
          <option value="ship-it">🚀 Ship-it mode</option>
          <option value="security">🛡️ Security reviewer</option>
          <option value="performance">⚡ Performance</option>
          <option value="pm">🎯 Product partner</option>
          <option value="debugger">🐛 Debugger</option>
          {getCustomPersonas().map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.label}
            </option>
          ))}
        </select>
        <details className="mt-2">
          <summary className="text-[11px] txt-muted hover:text-gold cursor-pointer">Define your own persona</summary>
          <PersonaEditor />
        </details>
      </div>

      <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-[11.5px] txt-body leading-relaxed">
        <div className="flex items-center gap-1.5 text-gold font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Pro tip
        </div>
        Use temperature <span className="font-mono text-gold">0.2</span> for council member votes (one-line diagnosis),
        and let the judge model default to its preferred temperature for the synthesis.
      </div>
    </div>
  );
}

// ---------- Data tab ----------

function DataTab({
  onExport,
  onImport,
  onImportChatGPT,
  onClear,
}: {
  onExport: () => void;
  onImport: (file: File) => void;
  onImportChatGPT: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold">Export everything</h3>
            <p className="text-[11.5px] txt-faint mb-3">
              Download a JSON file with all your sessions, settings, and provider configurations.
            </p>
            <button
              onClick={onExport}
              className="px-3 py-1.5 rounded-lg bg-gold text-white text-[12px] font-semibold hover:bg-gold-light transition-colors"
            >
              Download backup
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold">Import a backup</h3>
            <p className="text-[11.5px] txt-faint mb-3">
              Restores sessions, settings, and keys from a Nurovia export file. Replaces current data.
            </p>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="inline-block px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] font-medium hover:border-gold/40 hover:text-gold cursor-pointer transition-colors"
            >
              Choose file…
            </label>
          </div>
        </label>
      </div>

      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold">Import from ChatGPT</h3>
            <p className="text-[11.5px] txt-faint mb-3">
              Drop your <code className="px-1 py-0.5 rounded bg-surface border border-theme/20 font-mono text-[10.5px] text-gold">conversations.json</code> from ChatGPT's data export. All chats become Nurovia sessions.
            </p>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportChatGPT(f);
                e.target.value = "";
              }}
              className="hidden"
              id="import-chatgpt"
            />
            <label
              htmlFor="import-chatgpt"
              className="inline-block px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] font-medium hover:border-emerald-500/40 hover:text-emerald-300 cursor-pointer transition-colors"
            >
              Choose conversations.json…
            </label>
          </div>
        </label>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold text-red-300">Erase everything</h3>
            <p className="text-[11.5px] txt-faint mb-3">
              Wipes all sessions, API keys, and settings from this browser. Cannot be undone.
            </p>
            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[12px] font-semibold hover:bg-red-500/25 transition-colors"
            >
              Erase all local data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- About tab ----------

function AboutTab() {
  return (
    <div className="space-y-4 text-[13px]">
      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold">Nurovia AI</h3>
            <p className="text-[11px] txt-faint">v0.1.0 · beta</p>
          </div>
        </div>
        <p className="text-[12.5px] txt-body leading-relaxed">
          Autonomous coding intelligence that debates your bug across multiple expert models,
          proposes validated fixes, and applies them only with your approval.
        </p>
      </div>

      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-5">
        <h3 className="text-[13px] font-semibold mb-2">How your data flows</h3>
        <ol className="text-[12px] txt-body space-y-1.5 list-decimal pl-5">
          <li>You type a message in this browser.</li>
          <li>
            Nurovia sends it <em>directly</em> to the LLM providers you've configured (OpenAI, Anthropic, etc).
          </li>
          <li>No Nurovia server sits in the middle. Your API keys and prompts never reach us.</li>
          <li>Council mode fans out to multiple providers in parallel; the judge synthesizes.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-5">
        <h3 className="text-[13px] font-semibold mb-2">Keyboard shortcuts</h3>
        <ul className="text-[12px] txt-body space-y-1">
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">↵</kbd> Send message</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">⇧↵</kbd> New line</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">/</kbd> Open slash commands</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">↑</kbd> Edit last user message</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">Esc</kbd> Stop streaming / close popover</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-background border border-theme/30 font-mono text-[10px]">⌘B</kbd> Toggle sidebar</li>
        </ul>
      </div>
    </div>
  );
}
function CustomCommandsTab({
  settings,
  onChange,
}: {
  settings: AppSettings;
  onChange: (next: AppSettings) => void | Promise<void>;
}) {
  const cmds = settings.customCommands ?? [];
  const [draft, setDraft] = useState({ label: "", description: "", template: "", emoji: "⚡" });
  const add = () => {
    if (!draft.label.startsWith("/") || !draft.template.trim()) return;
    const next = [
      ...cmds,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: draft.label,
        description: draft.description || "Custom command",
        template: draft.template,
        emoji: draft.emoji || "⚡",
      },
    ];
    onChange({ ...settings, customCommands: next });
    setDraft({ label: "", description: "", template: "", emoji: "⚡" });
  };
  const remove = (id: string) => {
    onChange({ ...settings, customCommands: cmds.filter((c) => c.id !== id) });
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold mb-1">Custom slash commands</h3>
        <p className="text-[11px] txt-faint mb-3">Define your own <code className="px-1 py-0.5 rounded bg-surface border border-theme/20 font-mono text-[10.5px] text-gold">/command</code> shortcuts. The template fills the input when picked.</p>
        <div className="space-y-2">
          {cmds.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface border border-theme/20">
              <span className="text-[14px] mt-0.5">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-mono font-semibold text-gold">{c.label}</p>
                <p className="text-[10.5px] txt-faint truncate">{c.description}</p>
              </div>
              <button
                onClick={() => remove(c.id)}
                className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {cmds.length === 0 && (
            <p className="text-[11.5px] txt-faint text-center py-4">No custom commands yet. Add one below.</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-theme/20 p-3 space-y-2">
        <p className="text-[11px] font-semibold txt-faint uppercase tracking-wider">Add a command</p>
        <div className="grid grid-cols-[60px_1fr] gap-2">
          <input
            value={draft.emoji}
            onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
            placeholder="⚡"
            maxLength={2}
            className="px-2 py-1.5 rounded-lg bg-surface border border-theme/30 text-[13px] text-center outline-none focus:border-gold/50"
          />
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="/mycommand"
            className="px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[13px] font-mono outline-none focus:border-gold/50"
          />
        </div>
        <input
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Short description"
          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] outline-none focus:border-gold/50"
        />
        <textarea
          value={draft.template}
          onChange={(e) => setDraft({ ...draft, template: e.target.value })}
          placeholder="Template text inserted into the input…"
          rows={3}
          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] font-mono outline-none focus:border-gold/50 resize-none"
        />
        <button
          onClick={add}
          disabled={!draft.label.startsWith("/") || !draft.template.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-white text-[12px] font-semibold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add command
        </button>
      </div>
    </div>
  );
}

function MemoryTab() {
  const toast = useToast();
  const [facts, setFacts] = useState<Array<{ id: string; text: string; category: "preference" | "context" | "fact" | "goal"; createdAt: string }>>(() => {
    try {
      const raw = localStorage.getItem("nurovia-ai-memory");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState({ text: "", category: "context" as "preference" | "context" | "fact" | "goal" });

  const refresh = () => {
    try {
      const raw = localStorage.getItem("nurovia-ai-memory");
      setFacts(raw ? JSON.parse(raw) : []);
    } catch {
      // ignore
    }
  };
  void refresh;

  const add = () => {
    if (!draft.text.trim()) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const next = [...facts, { id, text: draft.text.trim(), category: draft.category, createdAt: new Date().toISOString() }];
    localStorage.setItem("nurovia-ai-memory", JSON.stringify(next));
    setFacts(next);
    setDraft({ text: "", category: "context" });
    toast.success("Memory fact added");
  };

  const remove = (id: string) => {
    const next = facts.filter((f) => f.id !== id);
    localStorage.setItem("nurovia-ai-memory", JSON.stringify(next));
    setFacts(next);
  };

  const categoryColor: Record<string, string> = {
    preference: "text-blue-400",
    context: "text-gold",
    fact: "text-emerald-400",
    goal: "text-purple-400",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-5">
        <h3 className="text-[14px] font-semibold mb-1">Cross-session memory</h3>
        <p className="text-[11.5px] txt-faint mb-3">
          Facts you want the council to remember across all sessions. Prepended as a system prompt to every message.
        </p>
        <div className="space-y-2 mb-3">
          {facts.length === 0 && (
            <p className="text-[11.5px] txt-faint text-center py-4">No memory facts yet. Add one below.</p>
          )}
          {facts.map((f) => (
            <div key={f.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface border border-theme/20">
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 w-20 shrink-0 ${categoryColor[f.category] || "txt-faint"}`}>
                {f.category}
              </span>
              <p className="flex-1 text-[12.5px] txt-body">{f.text}</p>
              <button
                onClick={() => remove(f.id)}
                className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                title="Forget"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-theme/30 bg-surface/40 p-5">
        <p className="text-[11px] font-semibold txt-faint uppercase tracking-wider mb-2">Add a fact</p>
        <div className="grid grid-cols-[120px_1fr] gap-2 mb-2">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as typeof draft.category })}
            className="px-3 py-2 rounded-lg bg-background border border-theme/30 text-[12px] outline-none focus:border-gold/50"
          >
            <option value="context">Context</option>
            <option value="preference">Preference</option>
            <option value="fact">Fact</option>
            <option value="goal">Goal</option>
          </select>
          <input
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                add();
              }
            }}
            placeholder='e.g. "Working on a Next.js app", "Prefer tabs over spaces", "My name is Alex"'
            className="px-3 py-2 rounded-lg bg-background border border-theme/30 text-[12.5px] outline-none focus:border-gold/50"
          />
        </div>
        <button
          onClick={add}
          disabled={!draft.text.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-white text-[12px] font-semibold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Remember this
        </button>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12.5px] font-semibold text-red-300">Forget everything</p>
            <p className="text-[11.5px] txt-faint mb-2">
              Removes all memory facts. Council will no longer remember anything across sessions.
            </p>
            <button
              onClick={() => {
                if (confirm("Erase all memory? Council will no longer remember anything.")) {
                  localStorage.removeItem("nurovia-ai-memory");
                  setFacts([]);
                  toast.success("Memory cleared");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[12px] font-semibold hover:bg-red-500/25 transition-colors"
            >
              Clear all memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaEditor() {
  const toast = useToast();
  const [draft, setDraft] = useState({ emoji: "🧠", label: "", description: "", systemPrompt: "" });
  const [custom, setCustom] = useState<Persona[]>(() => getCustomPersonas());

  const refresh = () => setCustom(getCustomPersonas());

  const add = () => {
    if (!draft.label.trim() || !draft.systemPrompt.trim()) return;
    const created = addCustomPersona({
      label: draft.label.trim(),
      description: draft.description.trim() || "Custom persona",
      emoji: draft.emoji || "🧠",
      systemPrompt: draft.systemPrompt,
    });
    setCustom([...custom, created]);
    setDraft({ emoji: "🧠", label: "", description: "", systemPrompt: "" });
    toast.success("Custom persona saved");
  };

  return (
    <div className="mt-2 rounded-xl border border-theme/20 p-3 space-y-2 bg-background/60">
      <p className="text-[10.5px] font-semibold txt-faint uppercase tracking-wider">Your personas ({custom.length})</p>
      {custom.map((p) => (
        <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg bg-surface border border-theme/20">
          <span className="text-base mt-0.5">{p.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold">{p.label}</p>
            <p className="text-[10.5px] txt-faint truncate">{p.description}</p>
          </div>
          <button
            onClick={() => {
              deleteCustomPersona(p.id);
              refresh();
              toast.success("Persona deleted");
            }}
            className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[60px_1fr] gap-2">
        <input
          value={draft.emoji}
          onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          maxLength={2}
          placeholder="🧠"
          className="px-2 py-1.5 rounded-lg bg-surface border border-theme/30 text-[13px] text-center outline-none focus:border-gold/50"
        />
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="Persona name"
          className="px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] outline-none focus:border-gold/50"
        />
      </div>
      <input
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="Short description"
        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] outline-none focus:border-gold/50"
      />
      <textarea
        value={draft.systemPrompt}
        onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
        placeholder="System prompt — tone, style, constraints..."
        rows={4}
        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-theme/30 text-[12px] font-mono outline-none focus:border-gold/50 resize-none"
      />
      <button
        onClick={add}
        disabled={!draft.label.trim() || !draft.systemPrompt.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-white text-[12px] font-semibold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Save persona
      </button>
    </div>
  );
}
