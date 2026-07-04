import { useMemo, useState } from "react";
import { Check, Copy, GitCompare, Wand2 } from "lucide-react";
import { Highlight, themes, type PrismTheme } from "prism-react-renderer";
import { diffLines } from "diff";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  /** When set, render a diff view against this prior code. */
  compareTo?: string;
  /** When provided, render an Apply button that triggers this callback. */
  onApply?: () => void;
}

const CODE_THEMES: Record<string, PrismTheme> = {
  vsDark: themes.vsDark,
  dracula: themes.dracula,
  nightOwl: themes.nightOwl,
  oceanicNext: themes.oceanicNext,
  palenight: themes.palenight,
  github: themes.github,
};

const CODE_THEME_STORAGE_KEY = "nurovia-ai-code-theme";

function getStoredCodeTheme(): string {
  try {
    return localStorage.getItem(CODE_THEME_STORAGE_KEY) ?? "vsDark";
  } catch {
    return "vsDark";
  }
}

function inferLanguage(lang?: string): string {
  if (!lang) return "text";
  const lower = lang.toLowerCase();
  if (lower === "ts") return "typescript";
  if (lower === "js") return "javascript";
  if (lower === "py") return "python";
  if (lower === "rb") return "ruby";
  if (lower === "yml") return "yaml";
  if (lower === "sh" || lower === "shell" || lower === "zsh") return "bash";
  return lower;
}

export function CodeBlock({ code, language, filename, compareTo, onApply }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(Boolean(compareTo));
  const lang = inferLanguage(language);

  const diffParts = useMemo(() => {
    if (!compareTo) return null;
    return diffLines(compareTo, code);
  }, [code, compareTo]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-2 rounded-xl border border-theme/30 bg-[#0b0d12] overflow-hidden text-[12.5px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface/60 border-b border-theme/20">
        <div className="flex items-center gap-2 text-[11px] txt-faint font-mono">
          <span className="text-gold">{lang}</span>
          {filename && <span className="txt-muted">· {filename}</span>}
        </div>
        <div className="flex items-center gap-1">
          {onApply && (
            <button
              onClick={onApply}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-gold hover:bg-gold/10 border border-transparent hover:border-gold/30 transition-colors"
              title="Apply this change with approval"
            >
              <Wand2 className="w-3 h-3" />
              Apply
            </button>
          )}
          {diffParts && (
            <button
              onClick={() => setShowDiff((v) => !v)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-colors ${
                showDiff ? "bg-gold/15 text-gold" : "txt-muted hover:bg-background"
              }`}
              title={showDiff ? "Show source" : "Show diff"}
            >
              <GitCompare className="w-3 h-3" />
              {showDiff ? "Source" : "Diff"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] txt-muted hover:bg-background hover:text-foreground transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {showDiff && diffParts ? (
        <DiffView parts={diffParts} />
      ) : (
        <Highlight code={code.replace(/\n$/, "")} language={lang} theme={CODE_THEMES[getStoredCodeTheme()] ?? themes.vsDark}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} m-0 p-3 overflow-x-auto font-mono text-[12.5px] leading-[1.55]`}
              style={{ ...style, background: "transparent" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-7 mr-3 text-right txt-faint select-none">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  );
}

function DiffView({ parts }: { parts: ReturnType<typeof diffLines> }) {
  return (
    <pre className="m-0 p-3 overflow-x-auto font-mono text-[12.5px] leading-[1.55]">
      {parts.map((part, i) => {
        const color =
          part.added
            ? "bg-emerald-500/10 text-emerald-200 border-l-2 border-emerald-400/60"
            : part.removed
            ? "bg-red-500/10 text-red-200 border-l-2 border-red-400/60"
            : "txt-body border-l-2 border-transparent";
        const sign = part.added ? "+ " : part.removed ? "- " : "  ";
        return (
          <div key={i} className={`px-2 -mx-2 whitespace-pre-wrap ${color}`}>
            {part.value
              .replace(/\n$/, "")
              .split("\n")
              .map((line, j) => (
                <div key={j}>
                  {sign}
                  {line || " "}
                </div>
              ))}
          </div>
        );
      })}
    </pre>
  );
}