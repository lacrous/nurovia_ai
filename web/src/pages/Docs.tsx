import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  KeyRound,
  Terminal,
  Paperclip,
  Mic,
  Wand2,
  Keyboard,
  Database,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Markdown } from "../components/Markdown";

interface DocSection {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: string;
}

const SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    icon: BookOpen,
    content: `# Getting started

Nurovia AI is an autonomous coding companion that runs a **council of expert AI models** in parallel, then synthesizes a consensus response. No middleman server — your API keys and prompts stay in your browser.

## Two ways to use it

1. **Drop in your own API keys** in **Settings → Providers**. We support OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, Qwen (DashScope), or any OpenAI-compatible endpoint.
2. **Or** set \`VITE_OPENAI_API_KEY\` / \`VITE_ANTHROPIC_API_KEY\` etc. at build time and the provider card will read it as "Configured via environment".

Then open **Chat**, type a bug or paste a stack trace, and the council convenes.

## What council mode means

When you have **two or more providers configured**, your message fans out to all of them in parallel. Each model returns a one-line diagnosis (the "vote"). A judge model (your selected provider) then writes a synthesis that calls out consensus, disagreement, and a recommended fix. The vote cards appear above the synthesis so you can see where the models disagreed.`,
  },
  {
    id: "council-mode",
    title: "Council mode",
    icon: Users,
    content: `# Council mode

Council mode is what makes Nurovia AI different from a normal chatbot.

## How a single message is processed

1. **Investigating** — your message is sent to every configured provider in parallel.
2. **Council member prompt** — each provider is asked for a 1–2 sentence diagnosis:

   > DIAGNOSIS: &lt;one short sentence naming the most likely root cause&gt;
   > FIX: &lt;one short sentence naming the single best fix&gt;

3. **Votes appear** as cards above the response (e.g. \`claude → validator rename\`, \`openai → field aliases\`, \`deepseek → config drift\`).
4. **Synthesizing** — your selected "judge" provider receives all votes and writes a consensus response.
5. **Done** — final answer is streamed into the chat.

## Disabling council mode

If you have multiple providers but want a single-model reply, click the **Council on/off** pill in the chat header. The chat will fall back to a direct call to your selected provider.

## Choosing the judge

The dropdown labeled **Judge** in the header picks which model does the synthesis. Convention: pick the strongest model you have access to (e.g. \`gpt-4o\`, \`claude-3.5-sonnet\`, \`qwen3.7-max\`).`,
  },
  {
    id: "providers",
    title: "Providers & API keys",
    icon: KeyRound,
    content: `# Providers & API keys

Nurovia AI calls LLM providers **directly from your browser**. No Nurovia server sits in the middle.

## Supported providers

| Provider   | Models                                              | Notes |
| ---------- | --------------------------------------------------- | ----- |
| OpenAI     | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o3-mini       | vision-capable |
| Anthropic  | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus  | vision-capable; sends \`anthropic-dangerous-direct-browser-access\` header |
| Gemini     | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash  | vision-capable |
| DeepSeek   | deepseek-chat, deepseek-reasoner                    | no vision |
| OpenRouter | any model on OpenRouter                             | vision-capable |
| Qwen       | qwen3.7-max/plus, qwen3.6-flash, qwen-coder-plus, qwen-vl-* | DashScope, vision-capable on vl models |
| Custom     | any OpenAI-compatible endpoint                      | vision-capable if your endpoint supports it |

## Testing a key before saving

In **Settings → Providers**, paste your API key and click the **⚡ Test** button. The card will ping the provider and report latency in milliseconds — green check before you commit. **Save** is a separate action.

## Where keys live

Your keys are stored in \`localStorage\` under \`nurovia-ai-provider-keys\`. They never leave your browser. Clear them at any time from **Settings → Data → Erase all local data**.`,
  },
  {
    id: "slash-commands",
    title: "Slash commands",
    icon: Terminal,
    content: `# Slash commands

Type \`/\` in the chat input to open the slash menu. Use ↑ / ↓ to navigate, Tab or Enter to insert.

| Command     | What it does |
| ----------- | ------------ |
| \`/fix\`       | Diagnose and fix a bug |
| \`/explain\`   | Explain what a piece of code does, line by line |
| \`/test\`      | Write thorough tests for the code (with edge cases) |
| \`/refactor\`  | Refactor for clarity and performance (preserves behavior) |
| \`/review\`    | Code review with specific suggestions |

Each command pre-fills the input with a template. Paste your code after the template and hit send.

## Examples

\`\`\`
/fix this Python error: my FastAPI app throws 422 on POST /users
\`\`\`

\`\`\`
/explain this function:

\`\`\`python
def fib(n, memo={0:0,1:1}):
    if n not in memo: memo[n] = fib(n-1) + fib(n-2)
    return memo[n]
\`\`\`
\`\`\``,
  },
  {
    id: "attachments",
    title: "Attachments & vision",
    icon: Paperclip,
    content: `# Attachments & vision

Drag-and-drop files into the input area (or click the **paperclip** button on the left of the input). Files appear as chips above the input and are sent to the council.

## What types are supported

- **Images** (PNG, JPEG, WebP, GIF) — up to 8 MB. Sent as proper image content blocks to vision-capable providers. Non-vision providers silently drop images.
- **Text files** (TXT, MD, JSON, CSV, YAML, source code) — read as text and inlined into the prompt as a fenced block with the filename.
- **Other files** — the bytes are not sent; only a metadata stub is included. Keep code/text under the 60k character cap.

## Per-provider vision support

| Provider  | Vision? |
| --------- | ------- |
| OpenAI    | ✅ |
| Anthropic | ✅ |
| Gemini    | ✅ |
| DeepSeek  | ❌ |
| OpenRouter| ✅ |
| Qwen      | ✅ on vl models (\`qwen-vl-plus\`, \`qwen-vl-max\`) |
| Custom    | depends on the endpoint |`,
  },
  {
    id: "voice",
    title: "Voice input",
    icon: Mic,
    content: `# Voice input

Click the **mic** button in the chat input row to dictate. Nurovia uses the browser's [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for live transcription — your voice never leaves your machine.

- Works in **Chrome**, **Edge**, and **Safari** (limited).
- Interim transcript appears below the input in red as you speak.
- Final transcript is appended to the existing input.
- If your browser doesn't support it, the mic button hides itself.`,
  },
  {
    id: "apply",
    title: "Approval-gated apply",
    icon: Wand2,
    content: `# Approval-gated apply

When the assistant proposes code in a fenced code block, every block gets a gold **Apply** button. Click it to:

1. See the proposed change in a modal.
2. **Paste the current code** of the file into the "Original code" box to preview a unified +/- diff.
3. **Copy the new code** to your clipboard.
4. **Download the new file** with the original filename.
5. **Download a \`.patch\` file** (if you provided the original) that you can apply with \`git apply\` or your editor.

Nothing writes to your filesystem automatically. The landing page promises "mutating changes pause for your explicit approval" — this is how that promise shows up in practice.

## Why clipboard + download, not direct write?

Browsers don't let websites write to your disk without explicit permission. Chrome's File System Access API requires you to pick a folder each time. Copy + download works everywhere, gives you full control, and keeps Nurovia sandboxed.`,
  },
  {
    id: "keyboard",
    title: "Keyboard shortcuts",
    icon: Keyboard,
    content: `# Keyboard shortcuts

| Shortcut    | Action |
| ----------- | ------ |
| \`Enter\`      | Send message |
| \`Shift+Enter\`| New line |
| \`/\`          | Open slash command menu |
| \`↑\` on empty input | Edit your last user message |
| \`Esc\`        | Stop streaming · close popover |
| \`⌘B\` / \`Ctrl+B\` | Toggle chat sidebar |
| \`⌘↵\` while editing a message | Save & resend |
| \`Tab\` in slash menu | Insert the highlighted command |

A hint bar under the chat input shows the shortcuts available in the current state.`,
  },
  {
    id: "data",
    title: "Data & privacy",
    icon: Database,
    content: `# Data & privacy

## What we store

Everything lives in your browser's \`localStorage\`:

| Key                              | Contents |
| -------------------------------- | -------- |
| \`nurovia-ai-chat-sessions\`        | Your chat history |
| \`nurovia-ai-provider-keys\`        | API keys you add |
| \`nurovia-ai-settings\`             | Temperature, council auto-engage, etc. |

No cookies, no analytics, no telemetry. No Nurovia server receives anything from you.

## What leaves your browser

Only the LLM provider calls you make. Each call goes directly from your browser to:
- \`api.openai.com\`
- \`api.anthropic.com\`
- \`generativelanguage.googleapis.com\`
- \`api.deepseek.com\`
- \`openrouter.ai\`
- \`dashscope-intl.aliyuncs.com\`
- or your custom base URL

## Export / import / erase

- **Settings → Data → Download backup** exports everything as a JSON file.
- **Settings → Data → Choose file…** imports a backup.
- **Settings → Data → Erase all local data** wipes \`localStorage\` keys. Cannot be undone.`,
  },
];

export function Docs() {
  useDocumentTitle("Docs");
  const [activeId, setActiveId] = useState(SECTIONS[0]!.id);

  useEffect(() => {
    const onScroll = () => {
      let bestId = activeId;
      let bestTop = Infinity;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < 200 && rect.top > -rect.height) {
          if (Math.abs(rect.top - 120) < bestTop) {
            bestTop = Math.abs(rect.top - 120);
            bestId = s.id;
          }
        }
      }
      if (bestId !== activeId) setActiveId(bestId);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <div className="mb-10">
        <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">Documentation</span>
        <h1 className="text-[32px] sm:text-[40px] font-bold mt-2 leading-tight">
          Everything you can do with Nurovia AI.
        </h1>
        <p className="text-[14px] txt-muted mt-3 max-w-2xl">
          How the council works, how to wire your providers, and the keyboard shortcuts that make it feel like an extension of your editor.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold text-white text-[12.5px] font-semibold hover:bg-gold-light transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open chat
          </Link>
          <span className="text-[11px] txt-faint">or jump to a section below ↓</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-2xl border border-theme/30 bg-surface/40 p-2">
            <p className="px-3 py-2 text-[10px] txt-faint uppercase tracking-widest">Sections</p>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setActiveId(s.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? "bg-gold/10 text-gold border-l-2 border-gold"
                          : "txt-muted hover:text-foreground hover:bg-surface"
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.title}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-[12.5px] font-semibold mt-2">Need help in chat?</p>
            <p className="text-[11.5px] txt-muted mt-1 mb-3">
              Use \`/explain\` or \`/review\` in the chat to have the council walk you through this doc.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gold hover:underline"
            >
              Try it now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* Content */}
        <article className="min-w-0 space-y-12">
          {SECTIONS.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="rounded-2xl border border-theme/30 bg-panel/40 p-6 sm:p-8 scroll-mt-20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-[24px] font-bold leading-tight">{s.title}</h2>
              </div>
              <Markdown>{s.content}</Markdown>
            </section>
          ))}

          <section className="rounded-2xl border border-gold/20 bg-gold/5 p-6 sm:p-8 text-center">
            <Sparkles className="w-6 h-6 text-gold mx-auto" />
            <h3 className="text-[18px] font-bold mt-3">That's the whole tour.</h3>
            <p className="text-[13px] txt-muted mt-1 mb-4">
              The best way to learn the council is to convene it. Open chat and try a slash command.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white text-[13px] font-semibold hover:bg-gold-light transition-colors"
            >
              Open chat <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </article>
      </div>
    </div>
  );
}