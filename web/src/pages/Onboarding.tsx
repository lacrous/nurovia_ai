import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Sparkles,
  Zap,
  MessageSquare,
  Check,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Brain,
} from "lucide-react";
import { fetchProviders, addKey, type ProviderInfo } from "../services/api";
import { useRequireAuth } from "../hooks/useRequireAuth";

const STEPS = [
  { id: "welcome", icon: Sparkles, title: "Welcome to the council" },
  { id: "provider", icon: Cpu, title: "Pick a provider" },
  { id: "key", icon: KeyRound, title: "Add your API key" },
  { id: "council", icon: Brain, title: "Council is ready" },
];

const SAMPLE_BUG =
  "My FastAPI app throws 422 on POST /users after upgrading Pydantic. Here's the relevant code:\n\n```python\nclass User(BaseModel):\n    class Config:\n        orm_mode = True\n    name: str\n    email: str\n```\n\nHelp me find the root cause.";

export function Onboarding() {
  useDocumentTitle("Get started");
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders().then(setProviders).catch(() => undefined);
  }, []);

  const provider = providers.find((p) => p.id === selected);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      await addKey({
        provider: selected,
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || undefined,
      });
    } catch {
      // ignore — we'll let the user save properly in Settings if this fails
    } finally {
      setSaving(false);
    }
    navigate("/chat");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                  i < step
                    ? "bg-gold text-white"
                    : i === step
                    ? "bg-gold/15 border border-gold text-gold"
                    : "bg-surface border border-theme/30 txt-muted"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-gold" : "bg-theme/30"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-theme/30 bg-panel/60 p-6 sm:p-8"
          >
            {step === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight">
                  Welcome, {user?.name?.split(" ")[0] ?? "builder"}.
                </h1>
                <p className="text-[14px] txt-muted mt-3 max-w-md mx-auto leading-relaxed">
                  The council convenes in four quick steps. We'll add your first provider, save your API key locally, and send a sample bug to the council — all in under a minute.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-left">
                  {[
                    { icon: Cpu, label: "Pick a provider" },
                    { icon: KeyRound, label: "Add a key" },
                    { icon: Brain, label: "Send a bug" },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface border border-theme/20">
                      <s.icon className="w-4 h-4 text-gold" />
                      <p className="text-[11.5px] txt-body mt-1.5 font-medium">{i + 1}. {s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 rounded-xl txt-muted text-[13px] hover:bg-surface"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
                  >
                    Let's go <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-[20px] font-bold">Pick your first provider</h2>
                <p className="text-[12.5px] txt-muted mt-1 mb-5">
                  Council mode needs at least one. You can add more later in Settings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        selected === p.id
                          ? "bg-gold/10 border-gold/40"
                          : "bg-surface border-theme/20 hover:border-gold/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-semibold">{p.name}</span>
                        {selected === p.id && <Check className="w-4 h-4 text-gold" />}
                      </div>
                      <p className="text-[11px] txt-faint mt-0.5">{p.default_model}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button onClick={back} className="px-3 py-2 txt-muted text-[13px] hover:bg-surface rounded-xl">
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                  </button>
                  <button
                    onClick={next}
                    disabled={!selected}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors disabled:opacity-40"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && provider && (
              <div>
                <h2 className="text-[20px] font-bold">Add your {provider.name} key</h2>
                <p className="text-[12.5px] txt-muted mt-1 mb-5">
                  Stored only in your browser's localStorage. Never sent to a Nurovia server.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11.5px] font-medium mb-1.5">API key</label>
                    <input
                      type="password"
                      autoFocus
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Paste your ${provider.name} API key`}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-mono outline-none focus:border-gold/50"
                    />
                  </div>
                  {provider.requires_base_url && (
                    <div>
                      <label className="block text-[11.5px] font-medium mb-1.5">
                        Base URL <span className="txt-faint font-normal">(optional, defaults applied)</span>
                      </label>
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={provider.base_url ?? "https://..."}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-theme/30 text-[13px] font-mono outline-none focus:border-gold/50"
                      />
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-[11.5px] txt-body leading-relaxed">
                    💡 Don't have a key handy? Click <strong className="text-gold">Skip</strong> — you can add one later in Settings.
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button onClick={back} className="px-3 py-2 txt-muted text-[13px] hover:bg-surface rounded-xl">
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={finish}
                      disabled={saving}
                      className="px-3 py-2.5 txt-muted text-[13px] hover:bg-surface rounded-xl"
                    >
                      Skip
                    </button>
                    <button
                      onClick={finish}
                      disabled={saving || !apiKey.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Save & continue"}
                      {!saving && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-[24px] font-bold">You're in.</h2>
                <p className="text-[13px] txt-muted mt-2 max-w-md mx-auto">
                  We've loaded a sample bug into the chat. Hit send to see the council deliberate — or type your own.
                </p>
                <div className="mt-5 p-4 rounded-xl bg-surface/60 border border-theme/30 text-left text-[12px] font-mono txt-body whitespace-pre-wrap leading-relaxed">
                  {SAMPLE_BUG}
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 txt-muted text-[13px] hover:bg-surface rounded-xl"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          "nurovia-ai-pending-input",
                          JSON.stringify({ text: SAMPLE_BUG, ts: Date.now() })
                        );
                      } catch {
                        // ignore
                      }
                      navigate("/chat");
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open chat with sample <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tip */}
        {step === 1 && (
          <p className="text-center text-[11px] txt-faint mt-4">
            <Zap className="w-3 h-3 inline mr-1 text-gold" />
            Pick <strong className="text-gold">OpenAI</strong> if you're not sure — gpt-4o-mini is fast and cheap.
          </p>
        )}
      </div>
    </div>
  );
}