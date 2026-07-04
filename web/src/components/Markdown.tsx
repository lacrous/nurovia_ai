import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

export interface CodeApplyPayload {
  code: string;
  language?: string;
  filename?: string;
}

interface MarkdownProps {
  children: string;
  className?: string;
  onCodeApply?: (payload: CodeApplyPayload) => void;
}

export function Markdown({ children, className, onCodeApply }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-gold hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-[18px] font-bold mt-3 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[16px] font-semibold mt-3 mb-1.5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-semibold mt-2.5 mb-1 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => <ul className="my-1.5 pl-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 pl-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 border-gold/40 txt-muted italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-theme/20" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-[12.5px] border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left px-2 py-1 border border-theme/30 bg-surface font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 border border-theme/20 align-top">{children}</td>
          ),
          code({ className: cls, children, ...props }) {
            const match = /language-([\w-]+)/.exec(cls || "");
            const code = String(children).replace(/\n$/, "");
            // inline code (no language tag, single line)
            if (!match && !code.includes("\n")) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-surface border border-theme/20 text-gold font-mono text-[12.5px]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                code={code}
                language={match?.[1]}
                filename={extractFilename(children)}
                onApply={
                  onCodeApply
                    ? () => onCodeApply({ code, language: match?.[1], filename: extractFilename(children) })
                    : undefined
                }
              />
            );
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {processCitations(children)}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Pre-process the markdown text to convert citation references like `[1]`, `[2]`
 * into styled superscript links. Citations are accumulated at the end of the response.
 */
function processCitations(text: string): string {
  // Match "[n]" or "[n, m]" patterns — but ignore markdown link syntax `[text](url)`
  // by requiring the bracket content to be a digit/comma sequence.
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, (_match, nums) => {
    const ids = String(nums).split(/\s*,\s*/).join(",");
    return `<sup class="citation-ref text-gold font-bold cursor-pointer" data-cite="${ids}">[${nums}]</sup>`;
  });
}

// Extract an optional "filename: path" hint from a code fence's first comment line.
function extractFilename(children: React.ReactNode): string | undefined {
  if (!Array.isArray(children)) return undefined;
  const first = children[0];
  if (typeof first !== "string") return undefined;
  const m = first.match(/^\s*(?:\/\/|#|--|;)\s*(?:file(?:\s*name)?|path)\s*:\s*([^\s\n]+)/i);
  return m?.[1];
}