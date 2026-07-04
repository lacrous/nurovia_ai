import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Zap,
  Loader2,
  ChevronDown,
  Settings2,
  Activity,
  DollarSign,
  Wrench,
  Gauge,
  Plus,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { type ProviderInfo, type ProviderKeyPublic, testProvider, testCredentials } from "../../services/api";
import { useToast } from "../ui";
import { getCapability } from "../../data/modelCapabilities";
import {
  getAdvanced,
  updateAdvanced,
  resetAdvanced,
  type ProviderAdvanced,
  type CustomHeader,
} from "../../data/providerAdvanced";
import {
  recordSample,
  getHistory,
  avgLatency,
  successRate as getSuccessRate,
  clearHistory,
  type HealthSample,
} from "../../data/providerHealth";

interface AdvancedProviderCardProps {
  provider: ProviderInfo;
  storedKey?: ProviderKeyPublic;
  onSaved: () => void | Promise<void>;
}

export function AdvancedProviderCard({ provider, storedKey, onSaved }: AdvancedProviderCardProps) {
  const toast = useToast();

  // --- Form state ---
  const [form, setForm] = useState({ api_key: "", base_url: "", default_model: "" });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState<ProviderAdvanced>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "history">("main");
  const [history, setHistory] = useState<HealthSample[]>([]);

  useEffect(() => {
    setAdvanced(getAdvanced(provider.id));
    setHistory(getHistory(provider.id));
  }, [provider.id]);

  const update = (patch: Partial<ProviderAdvanced>) => {
    setAdvanced((a) => {
      const next = { ...a, ...patch };
      updateAdvanced(provider.id, next);
      return next;
    });
  };

  const avgLat = useMemo(() => avgLatency(provider.id), [history]);
  const successPct = useMemo(() => getSuccessRate(provider.id), [history]);
  const selectedModel = form.default_model || provider.default_model;
  const cap = getCapability(selectedModel);

  // --- Multi-key rotation pool ---
  const allKeys = useMemo(() => {
    const pool: string[] = [];
    if (form.api_key.trim()) pool.push(form.api_key.trim());
    if (storedKey?.masked_key) pool.push(storedKey.masked_key);
    return pool;
  }, [form.api_key, storedKey]);

  // --- Handlers ---
  const saveKey = async () => {
    if (!form.api_key.trim()) {
      toast.error("API key is required");
      return;
    }
    setSaving(true);
    try {
      const { addKey } = await import("../../services/api");
      await addKey({
        provider: provider.id,
        api_key: form.api_key.trim(),
        base_url: form.base_url.trim() || undefined,
        default_model: form.default_model.trim() || undefined,
      });
      toast.success(`${provider.name} key saved`);
      setForm((f) => ({ ...f, api_key: "" }));
      await onSaved();
      await runTest("ping");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteKey = async () => {
    try {
      const { deleteKey: del } = await import("../../services/api");
      await del(provider.id);
      toast.success(`${provider.name} key removed`);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const runTest = async (kind: HealthSample["test"]) => {
    const start = performance.now();
    const apiKey = form.api_key.trim() || localGetKey(provider.id);
    const result = await (apiKey
      ? testCredentials(
          provider.id,
          apiKey,
          form.base_url.trim() || provider.base_url || "",
          form.default_model.trim() || provider.default_model || ""
        )
      : testProvider(provider.id)
    ).catch((e: unknown) => ({ ok: false, message: e instanceof Error ? e.message : String(e), latencyMs: 0 }));
    const elapsed = Math.round(performance.now() - start);
    const sample: HealthSample = {
      at: new Date().toISOString(),
      ok: result.ok,
      latencyMs: elapsed,
      test: kind,
      message: result.message,
    };
    recordSample(provider.id, sample);
    setHistory(getHistory(provider.id));
    if (result.ok) toast.success(`${provider.name} · ${kind} · ${elapsed} ms`);
    else toast.error(`${provider.name}: ${result.message}`);
  };

  // --- Render ---
  const StatusDot = () => {
    const last = history[0];
    if (!last) return <div className="w-2 h-2 rounded-full bg-gray-500/50" />;
    const color = !last.ok ? "bg-red-400" : last.latencyMs > 3500 ? "bg-amber-400" : "bg-emerald-400";
    return <div className={`w-2 h-2 rounded-full ${color}`} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-theme/30 bg-surface/40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-theme/20">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <StatusDot />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] font-semibold">{provider.name}</h3>
              {advanced.alias && (
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[9px] font-bold uppercase tracking-wider">
                  {advanced.alias}
                </span>
              )}
              {cap.reasoning && (
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[9px] font-semibold uppercase tracking-wider">
                  reasoning
                </span>
              )}
              {cap.vision && (
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[9px] font-semibold uppercase tracking-wider">
                  vision
                </span>
              )}
              {cap.audio && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] font-semibold uppercase tracking-wider">
                  audio
                </span>
              )}
              {cap.tools && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-semibold uppercase tracking-wider">
                  tools
                </span>
              )}
              {cap.json && (
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-semibold uppercase tracking-wider">
                  json
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10.5px] txt-faint">
              {storedKey ? (
                <span className="font-mono">● {storedKey.masked_key}</span>
              ) : (
                <span>no key configured</span>
              )}
              {successPct !== null && <span>· {successPct}% success</span>}
              {avgLat !== null && <span>· avg {avgLat}ms</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
              showAdvanced
                ? "bg-gold/10 border-gold/30 text-gold"
                : "bg-background border-theme/30 hover:border-gold/40 hover:text-gold"
            }`}
            title="Advanced settings"
          >
            <Settings2 className="w-3 h-3 inline mr-1" />
            Advanced
          </button>
          {storedKey && (
            <button
              onClick={deleteKey}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
              title="Remove key"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Capability & cost strip */}
      <div className="px-4 py-2.5 border-b border-theme/20 bg-panel/30 flex items-center gap-4 text-[10.5px] txt-muted flex-wrap">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-gold" />
          <span className="font-mono">{formatTokens(cap.contextWindow)}</span> context
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gold" />
          <span className="font-mono">${cap.inputPer1M.toFixed(3)}</span>/M in
          <span className="font-mono">${cap.outputPer1M.toFixed(3)}</span>/M out
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gold" />
          trained through {cap.knowledge}
        </span>
      </div>

      {/* Main form */}
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[11px] font-semibold txt-muted uppercase tracking-wider">
            API key
          </label>
          <div className="relative mt-1.5">
            <input
              type={showKey ? "text" : "password"}
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder={storedKey ? "Replace existing key…" : "sk-…"}
              className="w-full pl-3 pr-10 py-2 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50 font-mono"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {storedKey && (
            <p className="text-[10px] txt-faint mt-1.5">
              Rotation pool: {allKeys.length} key{allKeys.length === 1 ? "" : "s"} available
            </p>
          )}
        </div>

        {provider.requires_base_url && (
          <div>
            <label className="text-[11px] font-semibold txt-muted uppercase tracking-wider">
              Base URL
            </label>
            <input
              type="url"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder={provider.base_url ?? "https://api.example.com/v1"}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50 font-mono"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold txt-muted uppercase tracking-wider">
              Default model
            </label>
            {provider.model_options && provider.model_options.length > 0 ? (
              <select
                value={form.default_model}
                onChange={(e) => setForm({ ...form, default_model: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50"
              >
                <option value="">Use provider default ({provider.default_model})</option>
                {provider.model_options.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.default_model}
                onChange={(e) => setForm({ ...form, default_model: e.target.value })}
                placeholder={provider.default_model}
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50 font-mono"
              />
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold txt-muted uppercase tracking-wider">
              Test panel
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <TestButton label="Ping" onClick={() => runTest("ping")} disabled={saving} />
              <TestButton label="Light" onClick={() => runTest("light")} disabled={saving} />
              <TestButton label="Heavy" onClick={() => runTest("heavy")} disabled={saving} />
              <TestButton label="Tool" onClick={() => runTest("tool")} disabled={saving} icon={Wrench} />
            </div>
          </div>
        </div>

        <button
          onClick={saveKey}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Save ${provider.name} key`}
        </button>
      </div>

      {/* Advanced section */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-theme/20 bg-panel/30 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Tabs inside advanced */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-theme/20 w-max">
                {(["main", "history"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      activeTab === t ? "bg-gold/15 text-gold" : "txt-muted hover:text-foreground"
                    }`}
                  >
                    {t === "main" ? "Parameters" : "History"}
                  </button>
                ))}
              </div>

              {activeTab === "main" && (
                <div className="space-y-5">
                  {/* Sampling parameters */}
                  <ParamSection title="Sampling">
                    <SliderField
                      label="Temperature"
                      hint="Higher = more creative, lower = more deterministic"
                      min={0}
                      max={2}
                      step={0.05}
                      value={advanced.temperature ?? 0.7}
                      onChange={(v) => update({ temperature: v })}
                    />
                    <SliderField
                      label="Top P"
                      hint="Nucleus sampling cutoff"
                      min={0}
                      max={1}
                      step={0.01}
                      value={advanced.topP ?? 1}
                      onChange={(v) => update({ topP: v })}
                    />
                    <SliderField
                      label="Presence penalty"
                      hint="Encourages talking about new topics"
                      min={-2}
                      max={2}
                      step={0.05}
                      value={advanced.presencePenalty ?? 0}
                      onChange={(v) => update({ presencePenalty: v })}
                    />
                    <SliderField
                      label="Frequency penalty"
                      hint="Discourages repetition"
                      min={-2}
                      max={2}
                      step={0.05}
                      value={advanced.frequencyPenalty ?? 0}
                      onChange={(v) => update({ frequencyPenalty: v })}
                    />
                    <NumField
                      label="Max tokens"
                      hint="Leave 0 for provider default"
                      value={advanced.maxTokens ?? 0}
                      onChange={(v) => update({ maxTokens: v })}
                    />
                  </ParamSection>

                  {/* Reasoning */}
                  {cap.reasoning && (
                    <ParamSection title="Reasoning effort">
                      <div className="grid grid-cols-4 gap-2">
                        {(["low", "medium", "high", "xhigh"] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => update({ reasoningEffort: level })}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                              advanced.reasoningEffort === level
                                ? "bg-gold/15 border-gold/40 text-gold"
                                : "bg-background border-theme/30 hover:border-gold/40"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10.5px] txt-faint mt-2 leading-relaxed">
                        Reasoning models (o1, o3, DeepSeek-R1, Gemini 2.5 thinking) deliberate before answering.
                        Higher effort = longer + more accurate, but more expensive.
                      </p>
                    </ParamSection>
                  )}

                  {/* Behaviour */}
                  <ParamSection title="Behaviour">
                    <ToggleField
                      label="Stream responses"
                      hint="Tokens stream in as they're generated. Disable for batch-style requests."
                      checked={advanced.streamEnabled !== false}
                      onChange={(v) => update({ streamEnabled: v })}
                    />
                    {cap.json && (
                      <ToggleField
                        label="JSON mode"
                        hint="Force response in valid JSON. May reduce quality."
                        checked={!!advanced.jsonMode}
                        onChange={(v) => update({ jsonMode: v })}
                      />
                    )}
                    <TextAreaField
                      label="System prompt override"
                      hint="Optional. Overrides the persona system prompt for this provider."
                      value={advanced.systemPromptOverride ?? ""}
                      onChange={(v) => update({ systemPromptOverride: v })}
                      placeholder={`e.g. "Always respond in formal Spanish" or "Use only TypeScript"`}
                    />
                  </ParamSection>

                  {/* Rotation */}
                  <ParamSection title="Resilience">
                    <SelectField
                      label="Key rotation"
                      hint="What to do when a key fails (429/401/5xx)"
                      value={advanced.rotation ?? "first-only"}
                      options={[
                        { value: "first-only", label: "First key only — no rotation" },
                        { value: "failover", label: "Failover — try next key on error" },
                        { value: "round-robin", label: "Round-robin — cycle every request" },
                      ]}
                      onChange={(v) => update({ rotation: v as ProviderAdvanced["rotation"] })}
                    />
                    <NumField
                      label="Cooldown (ms)"
                      hint="Minimum ms between consecutive requests on the same key"
                      value={advanced.cooldownMs ?? 0}
                      onChange={(v) => update({ cooldownMs: v })}
                    />
                    <TextField
                      label="Provider alias"
                      hint="Friendly label for this connection (shown in council chips)"
                      value={advanced.alias ?? ""}
                      onChange={(v) => update({ alias: v })}
                      placeholder="e.g. Personal, Work, Side project"
                    />
                  </ParamSection>

                  {/* Custom headers */}
                  <ParamSection title="Custom headers">
                    <HeaderEditor
                      headers={advanced.customHeaders ?? []}
                      onChange={(h) => update({ customHeaders: h })}
                    />
                  </ParamSection>

                  {/* Cost calculator */}
                  <ParamSection title="Cost calculator">
                    <CostCalculator
                      inputPer1M={cap.inputPer1M}
                      outputPer1M={cap.outputPer1M}
                    />
                  </ParamSection>

                  <button
                    onClick={() => {
                      resetAdvanced(provider.id);
                      setAdvanced({});
                      toast.success("Advanced settings reset");
                    }}
                    className="text-[11px] txt-faint hover:text-red-400 transition-colors"
                  >
                    Reset all advanced settings
                  </button>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] txt-faint">
                      Last {history.length} test{history.length === 1 ? "" : "s"} · {successPct ?? "—"}% success
                    </p>
                    <button
                      onClick={() => {
                        clearHistory(provider.id);
                        setHistory([]);
                      }}
                      className="text-[11px] txt-muted hover:text-red-400"
                    >
                      Clear log
                    </button>
                  </div>
                  {history.length > 0 && <LatencyBars samples={history} />}
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {history.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11.5px] border ${
                          s.ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {s.ok ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                          <span className="font-mono text-[10px] uppercase tracking-wider txt-faint shrink-0">{s.test}</span>
                          <span className="truncate txt-body">{s.message}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-[11px]">{s.latencyMs} ms</span>
                          <span className="text-[10px] txt-faint">{timeAgo(s.at)}</span>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-8 txt-muted">
                        <Activity className="w-5 h-5 mx-auto mb-1 txt-faint" />
                        <p className="text-[12px]">No tests yet. Click any test button to start.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status footer */}
      {history[0] && (
        <button
          onClick={() => setShowInspector((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-[11px] border-t border-theme/20 transition-colors ${
            history[0].ok ? "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300" : "bg-red-500/5 hover:bg-red-500/10 text-red-300"
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            {history[0].ok ? <Check className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
            <span className="truncate">{history[0].message}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="font-mono">{history[0].latencyMs}ms</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showInspector ? "rotate-180" : ""}`} />
          </span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {showInspector && history[0]?.request && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-theme/20 bg-black/40 overflow-hidden"
          >
            <pre className="px-4 py-3 text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap break-all text-muted-foreground">
{history[0].request.method} {history[0].request.url}
{history[0].request.bodyPreview}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- sub-components ----------

function formatTokens(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function localGetKey(providerId: string): string {
  try {
    const raw = window.localStorage.getItem("nurovia-ai-provider-keys");
    if (!raw) return "";
    const all = JSON.parse(raw) as Record<string, { api_key: string }>;
    return all[providerId]?.api_key ?? "";
  } catch {
    return "";
  }
}

function TestButton({ label, onClick, disabled, icon: Icon = Zap }: { label: string; onClick: () => void; disabled?: boolean; icon?: LucideIcon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-background border border-theme/30 text-[10.5px] font-medium hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function ParamSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10.5px] font-bold txt-faint uppercase tracking-widest mb-2.5">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SliderField({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-medium">{label}</label>
        <span className="text-[11px] font-mono text-gold">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-gold"
      />
      {hint && <p className="text-[10.5px] txt-faint mt-1">{hint}</p>}
    </div>
  );
}

function ToggleField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <div className="flex-1">
        <span className="text-[12px] font-medium">{label}</span>
        {hint && <p className="text-[10.5px] txt-faint mt-0.5">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-gold" : "bg-surface border border-theme/30"}`}
        type="button"
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function NumField({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[12px] font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50 font-mono"
      />
      {hint && <p className="text-[10.5px] txt-faint mt-1">{hint}</p>}
    </div>
  );
}

function TextField({ label, hint, value, onChange, placeholder }: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[12px] font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50"
      />
      {hint && <p className="text-[10.5px] txt-faint mt-1">{hint}</p>}
    </div>
  );
}

function TextAreaField({ label, hint, value, onChange, placeholder }: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[12px] font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-theme/30 text-[12.5px] outline-none focus:border-gold/50 font-mono resize-y"
      />
      {hint && <p className="text-[10.5px] txt-faint mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-background border border-theme/30 text-[13px] outline-none focus:border-gold/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="text-[10.5px] txt-faint mt-1">{hint}</p>}
    </div>
  );
}

function HeaderEditor({ headers, onChange }: { headers: CustomHeader[]; onChange: (h: CustomHeader[]) => void }) {
  const addRow = () => onChange([...headers, { key: "", value: "" }]);
  const removeRow = (i: number) => onChange(headers.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<CustomHeader>) =>
    onChange(headers.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  return (
    <div className="space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={h.key}
            onChange={(e) => updateRow(i, { key: e.target.value })}
            placeholder="X-Org-Id"
            className="flex-1 px-2 py-1.5 rounded-md bg-background border border-theme/30 text-[12px] font-mono"
          />
          <input
            value={h.value}
            onChange={(e) => updateRow(i, { value: e.target.value })}
            placeholder="value"
            className="flex-1 px-2 py-1.5 rounded-md bg-background border border-theme/30 text-[12px] font-mono"
          />
          <button
            onClick={() => removeRow(i)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-[11px] text-gold hover:underline"
      >
        <Plus className="w-3 h-3" />
        Add header
      </button>
      <p className="text-[10.5px] txt-faint mt-1">
        Sent on every request to this provider. Useful for Azure OpenAI resource IDs, custom auth schemes, or org tracking.
      </p>
    </div>
  );
}

function CostCalculator({ inputPer1M, outputPer1M }: { inputPer1M: number; outputPer1M: number }) {
  const [inTokens, setInTokens] = useState(500);
  const [outTokens, setOutTokens] = useState(500);

  const cost = (inTokens / 1_000_000) * inputPer1M + (outTokens / 1_000_000) * outputPer1M;

  return (
    <div className="rounded-xl bg-background border border-theme/30 p-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10.5px] font-bold txt-faint uppercase tracking-widest">Input tokens</label>
          <input
            type="number"
            value={inTokens}
            onChange={(e) => setInTokens(parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full px-2 py-1.5 rounded-md bg-panel border border-theme/30 text-[12px] font-mono"
          />
        </div>
        <div>
          <label className="text-[10.5px] font-bold txt-faint uppercase tracking-widest">Output tokens</label>
          <input
            type="number"
            value={outTokens}
            onChange={(e) => setOutTokens(parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full px-2 py-1.5 rounded-md bg-panel border border-theme/30 text-[12px] font-mono"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-theme/20">
        <span className="text-[10.5px] txt-faint uppercase tracking-widest">Total cost (1 call)</span>
        <span className="text-[18px] font-bold text-gold">${cost < 0.0001 ? "<$0.0001" : cost.toFixed(4)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-theme/20">
        <PresetCalc label="100 msgs/day" msgs={100} inAvg={inTokens} outAvg={outTokens} in1={inputPer1M} out1={outputPer1M} />
        <PresetCalc label="1k msgs/day" msgs={1000} inAvg={inTokens} outAvg={outTokens} in1={inputPer1M} out1={outputPer1M} />
        <PresetCalc label="10k msgs/day" msgs={10_000} inAvg={inTokens} outAvg={outTokens} in1={inputPer1M} out1={outputPer1M} />
      </div>
    </div>
  );
}

function PresetCalc({ label, msgs, inAvg, outAvg, in1, out1 }: { label: string; msgs: number; inAvg: number; outAvg: number; in1: number; out1: number }) {
  const daily = msgs * ((inAvg / 1_000_000) * in1 + (outAvg / 1_000_000) * out1);
  return (
    <div className="text-center">
      <p className="text-[9px] txt-faint uppercase tracking-wider">{label}</p>
      <p className="text-[12px] font-mono font-bold mt-0.5">${daily.toFixed(2)}/d</p>
      <p className="text-[9.5px] txt-faint">${(daily * 30).toFixed(0)}/mo</p>
    </div>
  );
}

function LatencyBars({ samples }: { samples: HealthSample[] }) {
  const max = Math.max(...samples.map((s) => s.latencyMs), 100);
  return (
    <div className="flex items-end gap-1 h-12 px-1">
      {samples.slice(0, 20).map((s, i) => {
        const h = (s.latencyMs / max) * 100;
        const color = !s.ok ? "bg-red-400/60" : s.latencyMs > 3500 ? "bg-amber-400/70" : "bg-emerald-400/70";
        return (
          <div
            key={i}
            className={`flex-1 rounded-t ${color} hover:opacity-100 transition-all`}
            style={{ height: `${h}%` }}
            title={`${s.test} · ${s.latencyMs}ms · ${new Date(s.at).toLocaleTimeString()}`}
          />
        );
      })}
    </div>
  );
}