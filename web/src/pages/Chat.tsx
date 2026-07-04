import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useFileDropZone } from "../hooks/useFileDropZone";
import { EmptySessions, EmptySearch } from "../components/Illustrations";
import { getActivePersonaId, getPersona } from "../data/personas";
import { getAllSlashCommands, type CustomSlashCommand } from "../data/slashCommands";
import { getWorkspaces, getActiveWorkspaceId, setActiveWorkspaceId, createWorkspace } from "../data/workspaces";
import { diffLines } from "diff";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Eraser,
  Settings,
  Search,
  Menu,
  ThumbsUp,
  ThumbsDown,
  Coins,
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  ChevronUp,
  Loader2,
  KeyRound,
  X,
  Code2,
  Users,
  Copy,
  Check,
  RefreshCw,
  Square,
  Bug,
  FlaskConical,
  Wrench,
  ScanSearch,
  History,
  ArrowUp,
  Mic,
  MicOff,
  Pencil,
  MoreHorizontal,
  FileDown,
  LogOut,
  Upload,
  Star,
  Share2,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { UserAvatar } from "../components/UserAvatar";
import { LazyMarkdown } from "../components/LazyMarkdown";
import type { CodeApplyPayload } from "../components/Markdown";
// (draft autosave handled inline below)
const Markdown = LazyMarkdown;
import { SettingsModal } from "../components/SettingsModal";
import { ToolCallCard } from "../components/agent/ToolCallCard";
import { AgentPlanPreview } from "../components/agent/AgentPlanPreview";
import { ApplyDiffModal } from "../components/ApplyDiffModal";
import { FileUpload, attachmentsToContentParts, readFile, fileIconFor, type PendingAttachment } from "../components/FileUpload";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { Tooltip, useToast } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ModalShell } from "../components/ModalShell";
import {
  SESSIONS_KEY,
  fetchProviders,
  fetchSettings,
  sessionToMarkdown,
  streamChat,
  type ChatMessage,
  type ChatStreamEvent,
  type CouncilVote,
  type ProviderInfo,
  type Stage,
  type AppSettings,
} from "../services/api";

function loadSessions(): Session[] | null {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((s: any) => s && typeof s === "object" && Array.isArray(s.messages))
      .map((s: any) => ({
        ...s,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        })),
      }));
  } catch {
    return null;
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  votes?: CouncilVote[];
  isStreaming?: boolean;
  stage?: Stage;
  context?: string;
  reaction?: "up" | "down" | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    providers: string[];
  };
  /** Previous version of the content for inline diff display after regeneration */
  previousContent?: string;
  /** Agent-mode plan steps rendered at the top of the assistant message */
  plan?: string[];
  /** Agent-mode tool calls executed during this response */
  toolCalls?: Extract<ChatStreamEvent, { type: "tool_call" }>[];
}

interface Session {
  id: string;
  title: string;
  updatedAt: Date;
  messages: Message[];
  starred?: boolean;
  persona?: string;
}

const MOCK_SESSIONS: Session[] = [
  {
    id: "1",
    title: "FastAPI 422 after Pydantic upgrade",
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "My FastAPI app throws 422 on POST /users after the latest Pydantic upgrade.",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        id: "m2",
        role: "assistant",
        content: "I'll inspect the model and route. Council is debating the most likely cause...",
        timestamp: new Date(Date.now() - 1000 * 60 * 9),
        votes: [
          { model: "claude", opinion: "validator rename" },
          { model: "openai", opinion: "field aliases" },
          { model: "deepseek", opinion: "config drift" },
        ],
      },
      {
        id: "m3",
        role: "assistant",
        content: "Consensus: replace deprecated `Config` class with `model_config`. Apply the 3-line diff?",
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
      },
    ],
  },
  {
    id: "2",
    title: "React useEffect infinite loop",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [],
  },
  {
    id: "3",
    title: "Docker compose networking",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: [],
  },
];

// Local legacy type kept for QUICK_PROMPTS (slash commands now use data/slashCommands.ts)
type IconComp = React.ComponentType<{ className?: string }>;

const QUICK_PROMPTS: { label: string; icon: IconComp; text: string }[] = [
  {
    label: "Debug a Python error",
    icon: Bug,
    text: "My FastAPI app throws 422 on POST /users after upgrading Pydantic. Help me find the root cause.",
  },
  {
    label: "Explain a React hook",
    icon: ScanSearch,
    text: "Explain how useEffect's cleanup function works, with an example of a memory leak it prevents.",
  },
  {
    label: "Refactor a function",
    icon: Wrench,
    text: "Refactor this function for readability. Show me the before/after:\n\n```ts\nfunction process(items: any[]) { let out = []; for (let i = 0; i < items.length; i++) { if (items[i].active) out.push({id: items[i].id, name: items[i].name.toUpperCase()}); } return out; }\n```",
  },
  {
    label: "Write tests",
    icon: FlaskConical,
    text: "Write pytest unit tests for a function that parses JWT tokens and validates the signature.",
  },
];

function deriveTitle(text: string, fallback = "New debug session"): string {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  const cleaned = firstLine
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/, "")
    .replace(/^#+\s*/, "")
    .replace(/^[-*]\s*/, "")
    .trim();
  if (!cleaned) return fallback;
  const max = 48;
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src="/logo-icon.svg"
        alt=""
        className="w-7 h-7 group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all"
      />
      <span className="text-[16px] font-bold text-gold tracking-tight">Nurovia AI</span>
    </Link>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={key++} className="bg-gold/25 text-gold rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function AttachmentStrip({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 flex flex-wrap gap-2"
    >
      {attachments.map((a) => {
        const Icon = fileIconFor(a.mime, a.name);
        return (
          <div
            key={a.id}
            className="group flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-surface border border-theme/30 text-[11px]"
            title={`${a.name} · ${(a.size / 1024).toFixed(1)} KB`}
          >
            {a.previewUrl ? (
              <img src={a.previewUrl} alt="" className="w-6 h-6 rounded-md object-cover border border-theme/30" />
            ) : (
              <Icon className="w-3.5 h-3.5 text-gold" />
            )}
            <span className="max-w-[160px] truncate txt-body">{a.name}</span>
            <button
              onClick={() => onRemove(a.id)}
              className="p-1 rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
              title="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </motion.div>
  );
}

function ChatMessage({
  message,
  onRegenerate,
  onApplyCode,
  onEdit,
  isEditing,
  editText,
  onEditTextChange,
  onEditSave,
  onEditCancel,
  onReaction,
}: {
  message: Message;
  onRegenerate?: () => void;
  onApplyCode?: (payload: CodeApplyPayload) => void;
  onEdit?: () => void;
  isEditing?: boolean;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  onReaction?: (r: "up" | "down") => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof message.content === "string" ? message.content : ""
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser ? "bg-surface border border-theme/30" : "bg-gold/10 border border-gold/20"
        }`}
      >
        {isUser ? <User className="w-4 h-4 txt-muted" /> : <Bot className="w-4 h-4 text-gold" />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {isUser && message.context && (
          <details className="mb-1.5 max-w-full">
            <summary className="flex items-center gap-1.5 text-[10px] txt-muted cursor-pointer hover:text-foreground transition-colors list-none">
              <Code2 className="w-3 h-3" />
              <span>Attached context · {message.context.length} chars</span>
            </summary>
            <pre className="mt-1.5 p-2.5 rounded-lg bg-surface border border-theme/20 text-[10px] txt-muted overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {message.context.slice(0, 2000)}
              {message.context.length > 2000 && "\n…(truncated)"}
            </pre>
          </details>
        )}

        {isEditing ? (
          <div className="w-full rounded-2xl bg-gold/10 border border-gold/30 p-3">
            <textarea
              autoFocus
              value={editText ?? ""}
              onChange={(e) => onEditTextChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onEditSave?.();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onEditCancel?.();
                }
              }}
              className="w-full px-2 py-1.5 rounded-lg bg-background border border-theme/30 text-[13.5px] txt-body outline-none focus:border-gold/50 resize-none"
              style={{ minHeight: "64px", maxHeight: "240px" }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={onEditSave}
                className="px-3 py-1 rounded-lg bg-gold text-white text-[11px] font-semibold hover:bg-gold-light transition-colors"
              >
                Save & resend
              </button>
              <button
                onClick={onEditCancel}
                className="px-3 py-1 rounded-lg txt-muted hover:bg-surface text-[11px]"
              >
                Cancel
              </button>
              <span className="text-[10px] txt-faint ml-auto">⌘↵ to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div
            className={`text-[14px] leading-relaxed ${
              isUser
                ? "px-4 py-3 rounded-2xl bg-gold text-white rounded-tr-sm whitespace-pre-wrap"
                : "px-4 py-3 rounded-2xl bg-panel border border-theme/20 rounded-tl-sm w-full"
            }`}
          >
            {!isUser && message.plan && message.plan.length > 0 && (
              <div className="mb-3">
                <AgentPlanPreview steps={message.plan} />
              </div>
            )}
            {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {message.toolCalls.map((t) => (
                  <ToolCallCard key={t.id} event={t} />
                ))}
              </div>
            )}

            {isUser ? (
              <>
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-nu-900/60 animate-pulse rounded-sm" />
                )}
              </>
            ) : (
              <>
                {message.content ? (
                  <Markdown onCodeApply={onApplyCode}>{message.content}</Markdown>
                ) : message.isStreaming ? (
                  <span className="txt-muted">…</span>
                ) : (
                  ""
                )}
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-gold/60 animate-pulse rounded-sm" />
                )}
              </>
            )}
          </div>
        )}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] txt-faint">{formatTime(message.timestamp)}</span>
          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isUser && !message.isStreaming && message.content && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] txt-muted hover:text-gold transition-colors px-1.5 py-0.5 rounded"
                    title="Copy message"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1 text-[10px] txt-muted hover:text-gold transition-colors px-1.5 py-0.5 rounded"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  )}
                </>
              )}
              {isUser && onEdit && !message.isStreaming && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1 text-[10px] txt-muted hover:text-gold transition-colors px-1.5 py-0.5 rounded"
                  title="Edit & resend"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
              {!isUser && !message.isStreaming && message.previousContent && message.previousContent !== message.content && (
                <DiffToggle previous={message.previousContent} current={message.content} />
              )}
              {!isUser && !message.isStreaming && message.content && onReaction && (
                <>
                  <button
                    onClick={() => onReaction("up")}
                    className={`flex items-center gap-1 text-[10px] transition-colors px-1.5 py-0.5 rounded ${
                      message.reaction === "up" ? "text-emerald-400" : "txt-muted hover:text-emerald-400"
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onReaction("down")}
                    className={`flex items-center gap-1 text-[10px] transition-colors px-1.5 py-0.5 rounded ${
                      message.reaction === "down" ? "text-red-400" : "txt-muted hover:text-red-400"
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!isUser && message.votes && message.votes.length > 0 && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            {message.votes.map((vote) => (
              <div
                key={vote.model}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-theme/20 text-[10px] txt-muted"
              >
                <span className="text-gold font-semibold">{vote.model}</span>{" "}
                <span className="opacity-80">→ {vote.opinion}</span>
              </div>
            ))}
          </div>
        )}
        {!isUser && message.usage && message.usage.totalTokens > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] txt-faint">
            <Coins className="w-3 h-3" />
            <span>{message.usage.totalTokens.toLocaleString()} tokens</span>
            <span className="opacity-50">·</span>
            <span>${message.usage.costUsd < 0.0001 ? "<0.0001" : message.usage.costUsd.toFixed(4)}</span>
            {message.usage.providers.length > 1 && (
              <>
                <span className="opacity-50">·</span>
                <span>{message.usage.providers.length} models</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const STAGE_LABEL: Record<Stage, string> = {
  planning: "Planning",
  investigating: "Investigating",
  deliberating: "Convening the council",
  tool_call: "Running tool",
  synthesizing: "Synthesizing consensus",
  done: "Done",
};

export function Chat() {
  const navigate = useNavigate();
  const { user, signout } = useAuth();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(() => {
  try {
    const raw = localStorage.getItem("nurovia-ai-sidebar-collapsed");
    return raw === null ? true : raw === "1"; // default = collapsed
  } catch {
    return true;
  }
});
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions() || MOCK_SESSIONS);
  const [activeId, setActiveId] = useState<string>(() => {
    const loaded = loadSessions();
    return loaded?.[0]?.id || MOCK_SESSIONS[0].id;
  });
  const [input, setInput] = useState("");
  const [inputSource, setInputSource] = useState<"typed" | "prefilled" | "voice">("typed");
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [toolDetail, setToolDetail] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string>(() => getActivePersonaId());
  const activePersona = getPersona(personaId);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [agentMode, setAgentMode] = useState(() => {
    try {
      return localStorage.getItem("nurovia-ai-agent-mode") === "1";
    } catch {
      return false;
    }
  });
  const [councilMode, setCouncilMode] = useState(() => {
  try {
    const v = localStorage.getItem("nurovia-ai-council-mode");
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
});
useEffect(() => {
  try {
    localStorage.setItem("nurovia-ai-council-mode", String(councilMode));
    localStorage.setItem("nurovia-ai-agent-mode", agentMode ? "1" : "0");
  } catch {
    // ignore
  }
}, [councilMode, agentMode]);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextText, setContextText] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const { dragging: chatDragging } = useFileDropZone({
    onFiles: (next) => {
      setAttachments((prev) => [...prev, ...next]);
      if (next.length > 0) toast.success(`${next.length} file${next.length === 1 ? "" : "s"} attached`);
    },
    disabled: isTyping,
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [applyPayload, setApplyPayload] = useState<CodeApplyPayload | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const abortRef = useRef<AbortController | null>(null);
  const lastUserTextRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  });

  const filteredSessions = (() => {
    if (!searchQuery.trim()) {
      const list = starredOnly ? sessions.filter((s) => s.starred) : sessions;
      return list.map((s) => ({ session: s, matches: [] as typeof s.messages, titleMatch: false }));
    }
    const q = searchQuery.toLowerCase();
    return sessions
      .filter((s) => !starredOnly || s.starred)
      .map((s) => {
        const titleMatch = (s.title || "").toLowerCase().includes(q);
        const messageMatches = s.messages.filter((m) =>
          typeof m.content === "string" && m.content.toLowerCase().includes(q)
        );
        if (titleMatch) {
          return { session: s, matches: [] as typeof s.messages, titleMatch: true };
        }
        if (messageMatches.length > 0) {
          return { session: s, matches: messageMatches, titleMatch: false };
        }
        return null;
      })
      .filter(Boolean) as Array<{
      session: typeof sessions[number];
      matches: typeof sessions[number]["messages"];
      titleMatch: boolean;
    }>;
  })();

  const activeSession: Session = sessions.find((s) => s.id === activeId) ?? sessions[0] ?? {
  id: "empty",
  title: "New debug session",
  updatedAt: new Date(),
  messages: [],
};
  useDocumentTitle(activeSession?.title ? `Chat · ${activeSession.title.slice(0, 30)}` : "Chat");

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem("nurovia-ai-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const data = await fetchProviders();
      setProviders(data);
      const configured = data.filter((p) => p.configured);
      if (configured.length && !selectedProviderId) {
        setSelectedProviderId(configured[0].id);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    loadProviders();
    // Pull pending input from onboarding (set via sessionStorage)
    try {
      const raw = sessionStorage.getItem("nurovia-ai-pending-input");
      if (raw) {
        const { text } = JSON.parse(raw) as { text: string };
        if (text) {
          setInput(text);
          setInputSource("prefilled");
        }
        sessionStorage.removeItem("nurovia-ai-pending-input");
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Click-outside to close session export menu (mousedown so it fires before the click that opens it finishes bubbling)
  useEffect(() => {
    if (!exportMenuId) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-export-menu]")) return;
      if (target.closest("[data-export-trigger]")) return;
      setExportMenuId(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [exportMenuId]);

  // Listen for ⌘K "Open settings" command
  useEffect(() => {
    const onOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("nurovia:open-settings", onOpenSettings);
    return () => window.removeEventListener("nurovia:open-settings", onOpenSettings);
  }, []);

  // Chat-level keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        regenerateLast();
        return;
      }
      if (mod && e.shiftKey && (e.key === "C" || e.key === "c")) {
        // Copy last assistant message
        e.preventDefault();
        const sess = sessions.find((s) => s.id === activeId);
        const lastAssistant = sess?.messages.filter((m) => m.role === "assistant").pop();
        if (lastAssistant && typeof lastAssistant.content === "string") {
          navigator.clipboard.writeText(lastAssistant.content).then(() => {
            toast.success("Copied last response");
          }).catch(() => undefined);
        }
        return;
      }
      if (mod && e.shiftKey && (e.key === "S" || e.key === "s")) {
        // Star current session
        e.preventDefault();
        if (activeId) toggleStar(activeId);
        return;
      }
      if (mod && e.shiftKey && (e.key === "D" || e.key === "d")) {
        // Duplicate current session
        e.preventDefault();
        const sess = sessions.find((s) => s.id === activeId);
        if (sess) duplicateSession(sess);
        return;
      }
      if (mod && e.key === "," && !inField) {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessions, activeId]);

  // Reload appSettings whenever Settings modal closes / changes happen.
  useEffect(() => {
    const refresh = () => fetchSettings().then(setAppSettings);
    refresh();
    const onSettingsChanged = () => refresh();
    window.addEventListener("nurovia-settings-changed", onSettingsChanged);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("nurovia-settings-changed", onSettingsChanged);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const configuredProviders = providers.filter((p) => p.configured);
  const councilAvailable = councilMode && configuredProviders.length >= 2;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!selectedProvider) {
      toast.error("Add at least one provider in Settings before chatting.");
      return;
    }

    const text = input.trim();
    const attachedContext = contextText.trim();
    const sendAttachments = attachments;
    lastUserTextRef.current = text;

    const baseContent: string | ChatMessage["content"] =
      sendAttachments.length > 0
        ? [
            { type: "text", text },
            ...attachmentsToContentParts(sendAttachments),
          ]
        : text;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: typeof baseContent === "string" ? baseContent : (text as string),
      timestamp: new Date(),
      context: attachedContext || undefined,
    };

    const isFirstUserMsg = activeSession.messages.filter((m) => m.role === "user").length === 0;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        return {
          ...s,
          title: isFirstUserMsg && s.title === "New debug session" ? deriveTitle(text, s.title) : s.title,
          messages: [...s.messages, userMsg],
          updatedAt: new Date(),
        };
      })
    );
    setInput("");
    setContextText("");
    setContextOpen(false);
    setSlashOpen(false);
    setAttachments([]);
    setIsTyping(true);
    setStage("investigating");
    // Capture previousContent for diff (only set by regenerateLast)
    const prevContent = previousContentRef.current;
    previousContentRef.current = undefined;

    const assistantId = (Date.now() + 1).toString();
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                  isStreaming: true,
                  stage: "investigating",
                  ...(prevContent ? { previousContent: prevContent } : {}),
                },
              ],
            }
          : s
      )
    );

    const apiMessages: ChatMessage[] = activeSession.messages
      .filter((m) => m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content: baseContent });

    const abort = new AbortController();
    abortRef.current = abort;

    let receivedError = "";
    try {
      for await (const event of streamChat({
        provider: selectedProvider.id,
        model: selectedProvider.default_model || undefined,
        messages: apiMessages,
        council: councilAvailable,
        context: attachedContext,
        signal: abort.signal,
        temperature: appSettings.temperature,
        agentMode: agentMode,
        personaPrompt: activePersona.systemPrompt || undefined,
        customSystemPrompts: appSettings.customSystemPrompts,
      })) {
        if (event.type === "text") {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + event.content }
                        : m
                    ),
                  }
                : s
            )
          );
        } else if (event.type === "votes") {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId ? { ...m, votes: event.votes } : m
                    ),
                  }
                : s
            )
          );
        } else if (event.type === "stage") {
          if (event.stage === "tool_call") {
            setToolDetail(event.detail ?? "tool");
          }
          setStage(event.stage);
          setStage(event.stage);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId ? { ...m, stage: event.stage } : m
                    ),
                  }
                : s
            )
          );
        } else if (event.type === "plan") {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId ? { ...m, plan: event.steps } : m
                    ),
                  }
                : s
            )
          );
        } else if (event.type === "tool_call") {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) => {
                      if (m.id !== assistantId) return m;
                      const list = (m.toolCalls ?? []).filter((t) => t.id !== event.id);
                      list.push(event);
                      return { ...m, toolCalls: list };
                    }),
                  }
                : s
            )
          );
        } else if (event.type === "error") {
          receivedError = event.message;
          toast.error(event.message);
        } else if (event.type === "usage") {
          // Accumulate per-response cost on the assistant message
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            usage: {
                              promptTokens: (m.usage?.promptTokens ?? 0) + event.promptTokens,
                              completionTokens: (m.usage?.completionTokens ?? 0) + event.completionTokens,
                              totalTokens: (m.usage?.totalTokens ?? 0) + event.totalTokens,
                              costUsd: (m.usage?.costUsd ?? 0) + event.costUsd,
                              providers: [...(m.usage?.providers ?? []), event.provider],
                            },
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // user-stopped, leave content as-is
      } else {
        receivedError = err?.message ?? "Unknown error";
        toast.error(receivedError);
      }
    } finally {
      setIsTyping(false);
      setStage(null);
      abortRef.current = null;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        isStreaming: false,
                        stage: "done",
                        content:
                          receivedError && !m.content
                            ? `Error: ${receivedError}`
                            : m.content,
                      }
                    : m
                ),
                updatedAt: new Date(),
              }
            : s
        )
      );
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const previousContentRef = useRef<string | undefined>(undefined);

const regenerateLast = async () => {
    if (!lastUserTextRef.current) return;
    const lastText = lastUserTextRef.current;
    // Pop the last assistant message, but stash its content as previousContent for diff
    let previousContent: string | undefined;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const last = s.messages[s.messages.length - 1];
        if (last && last.role === "assistant" && typeof last.content === "string") {
          previousContent = last.content;
        }
        return { ...s, messages: s.messages.slice(0, -1) };
      })
    );
    // Stash in a ref so handleSend can attach it to the new assistant message
    previousContentRef.current = previousContent;
    setInput(lastText);
    // Defer until state flushes
    requestAnimationFrame(() => handleSend());
  };

  const startEditMessage = (m: Message) => {
    setEditingMessageId(m.id);
    setEditingText(typeof m.content === "string" ? m.content : "");
  };

  const toggleReaction = (messageId: string, reaction: "up" | "down") => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === messageId
            ? { ...m, reaction: m.reaction === reaction ? null : reaction }
            : m
        ),
      }))
    );
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEditAndResend = async () => {
    const id = editingMessageId;
    const text = editingText.trim();
    if (!id || !text) return;
    // Truncate everything from the edited message onward, replace its content,
    // and re-send the message through the council.
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const idx = s.messages.findIndex((m) => m.id === id);
        if (idx === -1) return s;
        const next = s.messages.slice(0, idx + 1);
        next[idx] = { ...next[idx]!, content: text };
        return { ...s, messages: next, updatedAt: new Date() };
      })
    );
    setEditingMessageId(null);
    lastUserTextRef.current = text;
    setInput(text);
    // Wait for state flush, then re-stream
    requestAnimationFrame(() => {
      // Pop the assistant placeholder that follows the edited user msg
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const idx = s.messages.findIndex((m) => m.id === id);
          if (idx === -1) return s;
          return { ...s, messages: s.messages.slice(0, idx + 1) };
        })
      );
      handleSend();
    });
  };

  const exportSession = async (s: Session) => {
    try {
      const md = await sessionToMarkdown(s, { includeVotes: true });
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(s.title || "session").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Session exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
    setExportMenuId(null);
  };

  const shareSession = async (s: Session) => {
    try {
      // Encode a sanitized snapshot (no API keys, just the conversation)
      const snapshot = {
        title: s.title,
        createdAt: new Date().toISOString(),
        messages: s.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : "[non-text content]",
          ...(m.votes ? { votes: m.votes } : {}),
        })),
      };
      const json = JSON.stringify(snapshot);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      const url = `${window.location.origin}/share/${encoded}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
    setExportMenuId(null);
  };

  const appendVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  // Re-create voice session if appender changes (e.g., after hot reload).
  useEffect(() => {
    if (!voice.listening) return;
    voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendVoiceTranscript]);

  const createSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "New debug session",
      updatedAt: new Date(),
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Hello. Paste a stack trace, describe a bug, or upload a repo and I'll convene the council.",
          timestamp: new Date(),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    if (activeId === id && next.length) setActiveId(next[0].id);
    // Offer undo
    const idx = sessions.findIndex((s) => s.id === id);
    const removed = sessions[idx];
    toast.withAction({
      message: `Deleted "${removed?.title ?? "chat"}"`,
      actionLabel: "Undo",
      duration: 6000,
      onAction: () => {
        setSessions((prev) => {
          if (prev.some((s) => s.id === id)) return prev;
          const inserted = [...prev];
          inserted.splice(Math.min(idx, inserted.length), 0, removed);
          return inserted;
        });
      },
    });
  };

  const clearAllSessions = () => {
    if (sessions.length === 0) return;
    // Snapshot for undo — we keep all history locally and restore on Undo
    const snapshot = sessions.slice();
    const count = snapshot.length;
    const fresh: Session = {
      id: `${Date.now()}`,
      title: "New debug session",
      updatedAt: new Date(),
      messages: [],
    };
    setSessions([fresh]);
    setActiveId(fresh.id);
    toast.withAction({
      message: `Cleared ${count} chat${count === 1 ? "" : "s"}`,
      actionLabel: "Undo",
      duration: 8000,
      onAction: () => {
        setSessions(snapshot);
        if (snapshot[0]) setActiveId(snapshot[0].id);
        toast.success("All chats restored");
      },
    });
  };

  const toggleStar = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: !s.starred } : s))
    );
    setExportMenuId(null);
    const s = sessions.find((x) => x.id === id);
    toast.success(s?.starred ? "Removed star" : "Starred");
  };

  const duplicateSession = (s: Session) => {
    const copy: Session = {
      ...s,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${s.title} (copy)`,
      updatedAt: new Date(),
      starred: false,
      messages: s.messages.map((m) => ({ ...m })),
    };
    const idx = sessions.findIndex((x) => x.id === s.id);
    setSessions((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setExportMenuId(null);
    setActiveId(copy.id);
    toast.success("Duplicated session");
  };

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden relative">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`border-r border-theme/20 bg-panel/40 flex flex-col shrink-0 min-h-0 transition-all duration-300 ease-in-out
          ${collapsed ? "w-14" : "w-72"}
          ${mobileSidebarOpen ? "fixed md:relative z-40 inset-y-0 left-0" : "hidden md:flex"}
        `}
      >
        {/* Header */}
        <div className={`h-14 border-b border-theme/20 flex items-center shrink-0 ${collapsed ? "justify-center px-2" : "justify-between px-3"}`}>
          {!collapsed ? (
            <Logo />
          ) : (
            <button onClick={() => setCollapsed(false)}>
              <img
                src="/logo-icon.svg"
                alt=""
                className="w-7 h-7 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all"
              />
            </button>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={`${collapsed ? "p-1.5" : "p-3"} space-y-2 shrink-0`}>
          {collapsed ? (
            <Tooltip text="New chat">
              <button
                onClick={createSession}
                className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl bg-gold text-white font-semibold hover:bg-gold-light transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={createSession}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gold text-white font-semibold hover:bg-gold-light transition-colors text-[13px]"
            >
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </button>
          )}

          {collapsed ? (
            <Tooltip text="Search chats">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl bg-surface border border-theme/30 text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-full py-2.5 gap-2 rounded-xl bg-surface border border-theme/30 text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors text-[13px]"
            >
              <Search className="w-4 h-4" />
              <span>Search chats</span>
            </button>
          )}
        </div>

        {/* Sessions */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 min-w-0">
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] txt-faint uppercase tracking-wider">
                {starredOnly ? "Starred" : "Recent chats"}
              </p>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setStarredOnly((v) => !v)}
                  className={`p-1 rounded-md transition-colors ${
                    starredOnly ? "text-gold bg-gold/10" : "txt-faint hover:text-gold hover:bg-surface"
                  }`}
                  title={starredOnly ? "Show all chats" : "Show starred only"}
                  aria-label={starredOnly ? "Show all chats" : "Show starred only"}
                >
                  <Star className={`w-3.5 h-3.5 ${starredOnly ? "fill-gold" : ""}`} />
                </button>
<Tooltip text={sessions.length === 0 ? "No chats to clear" : ("Clear all " + sessions.length + " chats (with undo)")}>
                  <button
                    onClick={clearAllSessions}
                    disabled={sessions.length === 0}
                    className="p-1 rounded-md txt-faint hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Clear all chats"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            {filteredSessions.length === 0 ? (
              <EmptySessions />
            ) : (
              filteredSessions.map(({ session: s }) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingId(s.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverId !== s.id) setDragOverId(s.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === s.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromId = draggingId;
                  if (fromId && fromId !== s.id) {
                    setSessions((prev) => {
                      const list = [...prev];
                      const fromIdx = list.findIndex((x) => x.id === fromId);
                      const toIdx = list.findIndex((x) => x.id === s.id);
                      if (fromIdx >= 0 && toIdx >= 0) {
                        const [moved] = list.splice(fromIdx, 1);
                        list.splice(toIdx, 0, moved!);
                      }
                      return list;
                    });
                  }
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                className={`relative group w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                  activeId === s.id
                    ? "bg-gold/10 border border-gold/20"
                    : "hover:bg-surface border border-transparent"
                } ${dragOverId === s.id ? "ring-1 ring-gold" : ""} ${draggingId === s.id ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => setActiveId(s.id)}
                  onDoubleClick={() => {
                    const next = prompt("Rename session", s.title);
                    if (next && next.trim() && next !== s.title) {
                      setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, title: next.trim() } : x)));
                    }
                  }}
                  className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                >
                  <MessageSquare className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium truncate" title={`Double-click to rename · "${s.title}"`}>{s.title}</p>
                      {s.starred && <Star className="w-3 h-3 text-gold fill-gold shrink-0" />}
                    </div>
                    <p className="text-[10px] txt-faint truncate">
                      {s.messages.length ? `${s.messages.length} messages` : "No messages"}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip text="More">
                    <button
                      data-export-trigger
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportMenuId(exportMenuId === s.id ? null : s.id);
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-gold hover:bg-red-500/0"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Delete">
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
                <AnimatePresence>
                {exportMenuId === s.id && (
                  <motion.div
                    data-export-menu
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-2 top-full mt-1 z-30 w-44 rounded-xl bg-panel border border-theme/30 shadow-xl py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => exportSession(s)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] txt-body hover:bg-surface text-left"
                    >
                      <FileDown className="w-3.5 h-3.5 text-gold" />
                      Export as Markdown
                    </button>
                    <button
                      onClick={() => duplicateSession(s)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] txt-body hover:bg-surface text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-gold" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => shareSession(s)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] txt-body hover:bg-surface text-left"
                    >
                      <Share2 className="w-3.5 h-3.5 text-gold" />
                      Share via link
                    </button>
                    <button
                      onClick={() => toggleStar(s.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] txt-body hover:bg-surface text-left"
                    >
                      <Star className="w-3.5 h-3.5 text-gold" />
                      {s.starred ? "Unstar" : "Star"}
                    </button>
                    <div className="my-1 border-t border-theme/15" />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(s.title);
                        toast.success("Title copied");
                        setExportMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] txt-body hover:bg-surface text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-gold" />
                      Copy title
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            ))
            )}
          </div>
        )}

        {/* Workspace switcher */}
        {!collapsed && <WorkspaceSwitcher />}

        {/* Bottom actions */}
        <div className={`mt-auto border-t border-theme/20 space-y-1 shrink-0 ${collapsed ? "p-1.5" : "p-3"}`}>
          {collapsed ? (
            <Tooltip text="Settings">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-[13px] txt-muted hover:bg-surface hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
          {collapsed ? (
            <Tooltip text={user?.name ?? "Account"}>
              <button className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl hover:bg-surface transition-colors">
                <UserAvatar size={24} name={user?.name} />
              </button>
            </Tooltip>
          ) : (
            <button className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-[13px] txt-muted hover:bg-surface hover:text-foreground transition-colors">
              <UserAvatar size={32} name={user?.name} />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium truncate">{user?.name ?? "Guest"}</p>
                <p className="text-[10px] txt-faint truncate">{user?.plan ? `${user.plan[0]!.toUpperCase()}${user.plan.slice(1)} plan` : "Pro trial"}</p>
              </div>
              <Tooltip text="Sign out">
                <button
                  onClick={() => {
                    signout();
                    navigate("/");
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </button>
          )}
        </div>
      </aside>

      {/* Search modal */}
      <AnimatePresence>
        {chatDragging && (
          <motion.div
            key="drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-gold bg-gold/5 backdrop-blur-[2px]" />
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              className="relative z-10 px-6 py-4 rounded-2xl bg-panel border border-gold shadow-2xl flex items-center gap-3"
            >
              <Upload className="w-5 h-5 text-gold" />
              <div>
                <p className="text-[14px] font-semibold">Drop to attach</p>
                <p className="text-[11px] txt-muted">Files will be added to this message</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {searchOpen && (
        <ModalShell
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          widthClass="max-w-md"
          topClass="pt-[15vh]"
          maxHeightClass="max-h-[60vh]"
        >
          <div className="p-3 border-b border-theme/20 flex items-center gap-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/50"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="text-[11px] txt-muted hover:text-foreground px-2 py-1 rounded-md hover:bg-surface"
            >
              Esc
            </button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filteredSessions.length === 0 ? (
              <EmptySearch query={searchQuery.trim() || undefined} />
            ) : (
              filteredSessions.map(({ session: s, matches, titleMatch }) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    setSearchOpen(false);
                    setCollapsed(false);
                  }}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {titleMatch ? highlightMatch(s.title, searchQuery) : s.title}
                    </p>
                    {matches.length > 0 && !titleMatch ? (
                      <p className="text-[10.5px] txt-muted line-clamp-2 mt-1">
                        {highlightMatch(
                          typeof matches[0].content === "string"
                            ? matches[0].content.slice(0, 140)
                            : "",
                          searchQuery
                        )}
                      </p>
                    ) : (
                      <p className="text-[10px] txt-faint truncate">
                        {s.messages.length ? `${s.messages.length} messages` : "No messages"}
                        {matches.length > 0 && ` · ${matches.length} match${matches.length === 1 ? "" : "es"}`}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ModalShell>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChanged={() => {
          loadProviders();
        }}
      />
      <ApplyDiffModal
        open={!!applyPayload}
        onClose={() => setApplyPayload(null)}
        code={applyPayload?.code ?? ""}
        language={applyPayload?.language}
        filename={applyPayload?.filename}
      />

      {/* Main chat area */}
      <motion.main
        layout
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-w-0 min-h-0"
      >
        {/* Navbar (compact) */}
        <header className="h-10 min-h-[40px] border-b border-theme/20 bg-panel/30 flex items-center justify-between px-3 sm:px-4 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-gold hover:bg-surface"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[12px] txt-muted hidden sm:inline">Judge</span>
            {loadingProviders ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : configuredProviders.length === 0 ? (
              <span className="text-[12px] text-red-400 truncate">No providers configured</span>
            ) : (
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                title="Provider used as the council's chair / single-mode model"
                className="px-3 py-1.5 rounded-xl bg-surface border border-theme/30 text-[13px] outline-none focus:border-gold/50 max-w-[180px] sm:max-w-xs truncate"
              >
                {configuredProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {configuredProviders.length >= 2 && (
              <Tooltip text={councilAvailable ? "Disable council" : "Council mode is off"}>
                <button
                  onClick={() => setCouncilMode((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                    councilAvailable
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "bg-surface border-theme/30 text-muted-foreground"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Council {councilAvailable ? "on" : "off"}
                  <span className="txt-faint font-normal hidden sm:inline">
                    · {configuredProviders.length}
                  </span>
                </button>
              </Tooltip>
            )}

            {stage && (
              <span className="hidden md:flex items-center gap-2 text-[11px] txt-muted">
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                {STAGE_LABEL[stage]}
                {toolDetail && stage === "tool_call" && (
                  <span className="font-mono text-[10.5px] text-gold">({toolDetail})</span>
                )}
              </span>
            )}

            <select
              value={personaId}
              onChange={(e) => {
                setPersonaId(e.target.value);
                try {
                  localStorage.setItem("nurovia-ai-active-persona", e.target.value);
                } catch {
                  // ignore
                }
                toast.success(`Persona: ${getPersona(e.target.value).label}`);
              }}
              className="hidden md:block px-2 py-1.5 rounded-xl bg-surface border border-theme/30 text-[11.5px] outline-none focus:border-gold/40 cursor-pointer hover:border-gold/40"
              title="Active persona"
            >
              <option value="default">✨ Default</option>
              <option value="senior-engineer">🧐 Senior engineer</option>
              <option value="junior-friendly">🎓 Explain to junior</option>
              <option value="ship-it">🚀 Ship-it mode</option>
              <option value="security">🛡️ Security</option>
              <option value="performance">⚡ Performance</option>
              <option value="pm">🎯 Product partner</option>
              <option value="debugger">🐛 Debugger</option>
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              title="API keys"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Body — messages (or empty slot) + input footer; centered between navbar and bottom when empty */}
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            activeSession.messages.length === 0 ? "justify-center pb-[18vh]" : ""
          }`}
        >
          {/* Messages area — hidden when empty (welcome lives in input footer instead) */}
          <motion.div
            layout
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 min-h-0 flex-col overflow-y-auto p-4 sm:p-6 space-y-6 ${
              activeSession.messages.length === 0 ? "hidden" : "flex"
            }`}
          >
          {activeSession.messages.map((m, idx) => {
            const isLastAssistant =
              m.role === "assistant" &&
              !m.isStreaming &&
              idx === activeSession.messages.length - 1 &&
              activeSession.messages.some((x) => x.role === "user");
            const isEditing = editingMessageId === m.id;
            return (
              <ChatMessage
                key={m.id}
                message={m}
                onRegenerate={isLastAssistant ? regenerateLast : undefined}
                onApplyCode={setApplyPayload}
                onEdit={m.role === "user" ? () => startEditMessage(m) : undefined}
                onReaction={m.role === "assistant" ? (r) => toggleReaction(m.id, r) : undefined}
                isEditing={isEditing}
                editText={isEditing ? editingText : undefined}
                onEditTextChange={setEditingText}
                onEditSave={isEditing ? saveEditAndResend : undefined}
                onEditCancel={isEditing ? cancelEdit : undefined}
              />
            );
          })}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-gold" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-panel border border-theme/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </motion.div>

        {/* Input — animates from centered → docked footer on first send */}
        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`bg-panel/40 shrink-0 border-t border-theme/20 ${
            activeSession.messages.length === 0 ? "border-t-0" : ""
          }`}
        >
          {/* Empty-state cue — sits directly above the input box, only when no messages */}
          {activeSession.messages.length === 0 && (
            <motion.div
              key="empty-cue"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center pt-4 pb-3 px-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <h2 className="text-[16px] sm:text-[18px] font-bold mb-1">How can the council help?</h2>
              <p className="text-[12px] txt-muted max-w-md mb-4">
                Ask anything. Paste code as context, or pick a quick start.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-xl">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => setInput(qp.text)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-theme/30 hover:border-gold/40 hover:bg-gold/5 text-left transition-colors"
                  >
                    <qp.icon className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="text-[11.5px] txt-body truncate">{qp.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <motion.div
            layout
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`relative mx-auto w-full p-3 sm:p-4 ${
              activeSession.messages.length === 0 ? "max-w-2xl" : "max-w-3xl"
            }`}
          >
            {/* Attachments preview (when any are added via inline icon, paste, or drop) */}
            <AttachmentStrip
              attachments={attachments}
              onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
            />

            {contextOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="mb-2 rounded-2xl bg-surface border border-theme/30 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-theme/20">
                  <div className="flex items-center gap-1.5 text-[11px] txt-muted">
                    <Code2 className="w-3.5 h-3.5 text-gold" />
                    Paste code or stack trace as context for the council
                  </div>
                  <button
                    onClick={() => {
                      setContextOpen(false);
                      setContextText("");
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:bg-background"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Paste the relevant file, stack trace, or error log here. The council will see it before they deliberate."
                  className="w-full px-3 py-2.5 bg-transparent text-[12px] font-mono txt-body placeholder:text-muted-foreground/50 outline-none resize-none"
                  style={{ minHeight: "120px", maxHeight: "240px" }}
                />
              </motion.div>
            )}

            {slashOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-10 left-0 right-0 bottom-full mb-2 rounded-2xl bg-panel border border-theme/30 shadow-2xl overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-theme/20 text-[10px] txt-faint uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3 h-3" /> Slash commands
                </div>
                {getAllSlashCommands().map((cmd, i) => {
                  const builtin = 'icon' in cmd && cmd.icon;
                  const Icon = builtin ? (cmd as { icon: React.ComponentType<{ className?: string }> }).icon : null;
                  return (
                  <motion.button
                    key={cmd.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12, delay: i * 0.02 }}
                    onMouseEnter={() => setSlashIndex(i)}
                    onClick={() => {
                      setInput(cmd.template);
                      setSlashOpen(false);
                      textareaRef.current?.focus();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      i === slashIndex ? "bg-gold/10" : "hover:bg-surface"
                    }`}
                  >
                    {Icon ? (
                      <Icon className="w-4 h-4 text-gold shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-gold shrink-0 text-center">{(cmd as CustomSlashCommand).emoji ?? "⚡"}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium font-mono text-gold">{cmd.label}</p>
                      <p className="text-[11px] txt-muted truncate">{cmd.description}</p>
                    </div>
                  </motion.button>
                  );
                })}
              </motion.div>
            )}

            <div className="relative">
              {inputSource === "prefilled" && input.length > 0 && (
                <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10.5px] font-medium z-10 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  Pre-filled from onboarding
                  <button
                    onClick={() => {
                      setInput("");
                      setInputSource("typed");
                    }}
                    className="ml-1 p-0.5 rounded hover:bg-gold/20"
                    title="Clear"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  setInput(v);
                  setSlashOpen(v.startsWith("/") && !v.includes(" "));
                  if (inputSource !== "typed") setInputSource("typed");
                }}
                onPaste={async (e) => {
                  // Inline image paste — convert pasted image to attachment
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (const item of Array.from(items)) {
                    if (item.kind === "file" && item.type.startsWith("image/")) {
                      const file = item.getAsFile();
                      if (!file) continue;
                      e.preventDefault();
                      try {
                        const att = await readFile(file);
                        if (att) {
                          setAttachments((prev) => [...prev, att]);
                          toast.success(`Image attached: ${file.name || "pasted image"}`);
                        }
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : String(err));
                      }
                      return;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (slashOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                    e.preventDefault();
                    const total = getAllSlashCommands().length;
                    setSlashIndex((i) =>
                      e.key === "ArrowDown"
                        ? (i + 1) % Math.max(1, total)
                        : (i - 1 + Math.max(1, total)) % Math.max(1, total)
                    );
                    return;
                  }
                  if (slashOpen && e.key === "Tab") {
                    e.preventDefault();
                    const cmd = getAllSlashCommands()[slashIndex];
                    if (cmd) {
                      setInput(cmd.template);
                      setSlashOpen(false);
                    }
                    return;
                  }
                  if (slashOpen && e.key === "Escape") {
                    e.preventDefault();
                    setSlashOpen(false);
                    return;
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (slashOpen) {
                      const cmd = getAllSlashCommands()[slashIndex];
                      if (cmd) {
                        setInput(cmd.template);
                        setSlashOpen(false);
                      }
                      return;
                    }
                    handleSend();
                  } else if (e.key === "Escape" && isTyping) {
                    e.preventDefault();
                    stopStreaming();
                  } else if (
                    e.key === "ArrowUp" &&
                    !e.shiftKey &&
                    input.trim() === "" &&
                    lastUserTextRef.current
                  ) {
                    e.preventDefault();
                    setInput(lastUserTextRef.current);
                  }
                }}
                placeholder={
                  isTyping
                    ? "Council is deliberating… press Esc to stop"
                    : "Describe a bug, paste a stack trace, or type / for commands"
                }
                disabled={isTyping}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-surface border border-theme/30 text-[14px] placeholder:text-muted-foreground/50 focus:border-gold/50 focus:ring-2 focus:ring-gold/10 outline-none resize-none overflow-hidden disabled:opacity-60"
                style={{ minHeight: "52px", maxHeight: "160px" }}
              />
              <button
                onClick={() => setContextOpen((v) => !v)}
                title="Attach code context"
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
                  contextOpen
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {contextOpen ? <ChevronUp className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              </button>
              {isTyping ? (
                <button
                  onClick={stopStreaming}
                  title="Stop (Esc)"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Agent mode toggle — inline, near Send */}
                  <Tooltip text={agentMode ? "Agent mode on — the assistant can plan steps and call tools" : "Chat mode — fast single-pass"}>
                    <button
                      onClick={() => setAgentMode((v) => !v)}
                      title="Toggle agent mode"
                      className={`p-2 rounded-xl transition-all ${
                        agentMode
                          ? "bg-gold text-white"
                          : "text-muted-foreground hover:bg-background hover:text-gold"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  {/* File attach */}
                  <FileUpload
                    attachments={attachments}
                    onChange={setAttachments}
                    onError={(msg) => toast.error(msg)}
                    disabled={isTyping}
                    inline
                  />

                  {voice.supported && (
                    <Tooltip text={voice.listening ? "Stop dictation" : "Dictate"}>
                      <button
                        onClick={voice.toggle}
                        disabled={!selectedProvider}
                        title={voice.listening ? "Stop dictation" : "Dictate with your mic"}
                        className={`p-2 rounded-xl transition-colors ${
                          voice.listening
                            ? "bg-red-500/15 border border-red-500/40 text-red-400"
                            : "text-muted-foreground hover:text-gold hover:bg-background"
                        }`}
                      >
                        {voice.listening ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    </Tooltip>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !selectedProvider}
                    title="Send (Enter)"
                    className="p-2 rounded-xl bg-gold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {voice.listening && (
              <p className="text-center text-[10px] text-red-400 mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Listening{voice.interim ? ` · ${voice.interim.slice(0, 80)}` : "…"}
              </p>
            )}
            <p className="text-center text-[10px] txt-faint mt-2 flex items-center justify-center gap-3 flex-wrap">
              <span>
                {councilAvailable
                  ? `${configuredProviders.length} models deliberating in parallel`
                  : selectedProvider
                  ? `Replying as ${selectedProvider.name}`
                  : "Add an API key in Settings to start"}
              </span>
              <span className="opacity-50">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">↵</kbd> send
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">⇧↵</kbd> newline
              </span>
              {isTyping && (
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-theme/30 font-mono text-[10px]">Esc</kbd> stop
                </span>
              )}
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> edit last
              </span>
            </p>
          </motion.div>
        </motion.div>
        </div>
      </motion.main>
    </div>
  );
}

function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState(getWorkspaces);
  const [activeId, setActiveId] = useState(getActiveWorkspaceId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  const switchTo = (id: string) => {
    setActiveWorkspaceId(id);
    setActiveId(id);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="px-3 pt-2" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-surface border border-theme/30 hover:border-gold/40 transition-colors text-left"
      >
        <span className="text-base">{active?.emoji ?? "🏠"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] txt-faint">Workspace</p>
          <p className="text-[12.5px] font-semibold truncate">{active?.name ?? "Personal"}</p>
        </div>
        <ChevronUp className="w-3.5 h-3.5 txt-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="mt-1 rounded-xl bg-panel border border-theme/30 shadow-xl p-1"
          >
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => switchTo(w.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left ${
                  w.id === activeId ? "bg-gold/10 text-gold" : "hover:bg-surface"
                }`}
              >
                <span>{w.emoji}</span>
                <span className="text-[12.5px] font-medium">{w.name}</span>
                {w.id === activeId && <span className="ml-auto text-[10px] txt-faint">active</span>}
              </button>
            ))}
            <div className="border-t border-theme/20 my-1" />
            <button
              onClick={() => {
                const name = prompt("New workspace name");
                if (!name) return;
                const emoji = prompt("Emoji", "✨") || "✨";
                const created = createWorkspace(name.trim(), emoji);
                setWorkspaces([...workspaces, created]);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface text-left text-[12px] txt-muted"
            >
              <Plus className="w-3.5 h-3.5" />
              New workspace
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DiffToggle({ previous, current }: { previous: string; current: string }) {
  const [open, setOpen] = useState(false);
  const diff = useMemo(() => {
    try {
      return diffLines(previous, current);
    } catch {
      return null;
    }
  }, [previous, current]);
  if (!diff) return null;
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[10px] transition-colors px-1.5 py-0.5 rounded ${
          open ? "text-gold bg-gold/10" : "txt-muted hover:text-gold"
        }`}
      >
        {open ? "Hide changes" : "Show changes"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg border border-theme/20 bg-surface/40 p-3 text-[11.5px] font-mono overflow-x-auto"
          >
            {diff.map((part: { added?: boolean; removed?: boolean; value: string }, i: number) => (
              <div
                key={i}
                className={
                  part.added
                    ? "bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded"
                    : part.removed
                    ? "bg-red-500/10 text-red-300 line-through px-2 py-0.5 rounded"
                    : "txt-muted px-2 py-0.5"
                }
              >
                {part.added ? "+ " : part.removed ? "- " : "  "}
                {part.value}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
