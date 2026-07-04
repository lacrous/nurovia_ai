import { useMemo, useState } from "react";
import { ModalShell } from "./ModalShell";
import { Check, Copy, Download, GitCompare, Sparkles } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { useToast } from "./ui";

interface ApplyDiffModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  language?: string;
  filename?: string;
  /** Optional "before" code for diff rendering. */
  originalCode?: string;
}

export function ApplyDiffModal({
  open,
  onClose,
  code,
  language,
  filename,
  originalCode,
}: ApplyDiffModalProps) {
  const toast = useToast();
  const [showDiff, setShowDiff] = useState(true);
  const [original, setOriginal] = useState(originalCode ?? "");
  const [copied, setCopied] = useState(false);

  const effectiveOriginal = useMemo(() => original.trim() || originalCode || "", [original, originalCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied new code to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Could not copy: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDownload = () => {
    const name = filename || `snippet.${language ?? "txt"}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  };

  const handleDownloadPatch = () => {
    const name = (filename || "snippet") + ".patch";
    const patch = generatePatch(filename ?? "snippet", effectiveOriginal, code);
    const blob = new Blob([patch], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      widthClass="max-w-4xl"
      topClass="pt-[6vh]"
      maxHeightClass="max-h-[88vh]"
      icon={
        <div>
          <GitCompare className="w-4 h-4 text-gold" />
        </div>
      }
      title={
        <div>
          <h2 className="text-[15px] font-semibold">Apply change</h2>
          <p className="text-[11px] txt-faint mt-0.5">
            Review the proposed {language ? <code className="text-gold">{language}</code> : "code"} change before applying.
          </p>
        </div>
      }
    >

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5 txt-body">
              Original code (paste here to preview a diff)
            </label>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste the current contents of the file…"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-theme/30 text-[12px] font-mono txt-body placeholder:text-muted-foreground/50 outline-none focus:border-gold/50 resize-none"
              style={{ minHeight: "120px", maxHeight: "240px" }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium txt-body">Proposed change</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowDiff((v) => !v)}
                  className={`px-2 py-0.5 rounded-md text-[10px] ${
                    showDiff ? "bg-gold/15 text-gold" : "bg-surface border border-theme/30 txt-muted hover:text-foreground"
                  }`}
                >
                  {showDiff ? "Showing diff" : "Show source"}
                </button>
              </div>
            </div>
            <CodeBlock
              code={code}
              language={language}
              filename={filename}
              compareTo={showDiff && effectiveOriginal ? effectiveOriginal : undefined}
            />
          </div>

          <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-[11.5px] txt-body leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
            <div>
              <span className="text-gold font-semibold">Approval-gated:</span> nothing is applied automatically. Use copy/download to put the new code where it needs to go. Browser security blocks us from writing to your filesystem without explicit permission.
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-theme/20 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-white text-[12px] font-semibold hover:bg-gold-light transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy new code"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-theme/30 text-[12px] font-medium hover:border-gold/40 hover:text-gold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download new file
          </button>
          {effectiveOriginal && (
            <button
              onClick={handleDownloadPatch}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-theme/30 text-[12px] font-medium hover:border-gold/40 hover:text-gold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .patch
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl txt-muted text-[12px] hover:bg-surface"
          >
            Close
          </button>
        </div>
    </ModalShell>
  );
}

function generatePatch(filename: string, before: string, after: string): string {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const out: string[] = [];
  out.push(`--- a/${filename}`);
  out.push(`+++ b/${filename}`);
  out.push(`@@ -1,${beforeLines.length} +1,${afterLines.length} @@`);
  for (const line of beforeLines) out.push(`-${line}`);
  for (const line of afterLines) out.push(`+${line}`);
  return out.join("\n");
}