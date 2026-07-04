import { lazy, Suspense } from "react";
import type { CodeApplyPayload } from "./Markdown";

const MarkdownImpl = lazy(() => import("./Markdown").then((m) => ({ default: m.Markdown })));

interface LazyMarkdownProps {
  children: string;
  className?: string;
  onCodeApply?: (payload: CodeApplyPayload) => void;
}

function MarkdownFallback() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 w-full bg-surface rounded" />
      <div className="h-3 w-5/6 bg-surface rounded" />
      <div className="h-3 w-4/6 bg-surface rounded" />
    </div>
  );
}

export function LazyMarkdown(props: LazyMarkdownProps) {
  return (
    <Suspense fallback={<MarkdownFallback />}>
      <MarkdownImpl {...props} />
    </Suspense>
  );
}