/**
 * Built-in tools — registered on app boot. Council can call these during deliberation.
 */
import { registerTool } from "../tools";
import { runPython } from "./python";

// --- Code execution (Python via Pyodide) ---
registerTool({
  name: "run_python",
  description: "Run a Python code snippet in a sandboxed interpreter. Returns stdout/stderr.",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string", description: "Python code to execute" },
    },
    required: ["code"],
  },
  execute: async (args) => {
    const code = String(args.code ?? "");
    if (!code.trim()) return { error: "code is required" };
    const result = await runPython(code);
    return result;
  },
});

// --- Web search via DuckDuckGo HTML (no key required) ---
registerTool({
  name: "web_search",
  description: "Search the public web via DuckDuckGo and return the top results as URLs + snippets.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      max_results: { type: "number", description: "Max results to return (default 5)" },
    },
    required: ["query"],
  },
  execute: async (args) => {
    const q = String(args.query ?? "");
    const limit = Math.min(Number(args.max_results ?? 5), 10);
    try {
      const res = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
        headers: { Accept: "text/html" },
      });
      const html = await res.text();
      const results: Array<{ title: string; url: string; snippet: string }> = [];
      const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = linkRegex.exec(html)) && results.length < limit) {
        results.push({
          url: m[1] ?? "",
          title: (m[2] ?? "").trim(),
          snippet: (m[3] ?? "").trim().replace(/<[^>]+>/g, ""),
        });
      }
      return { results };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// --- Date / time ---
registerTool({
  name: "current_datetime",
  description: "Return the current UTC date and time. Use when time-sensitive info is needed.",
  parameters: { type: "object", properties: {} },
  execute: async () => ({
    iso: new Date().toISOString(),
    unixMs: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});

// --- Calculator ---
registerTool({
  name: "calculate",
  description: "Evaluate a math expression. Returns the numeric result. Supports +,-,*,/,%,sqrt,sin,cos,tan,log,exp,pi,e.",
  parameters: {
    type: "object",
    properties: {
      expression: { type: "string", description: "Math expression to evaluate" },
    },
    required: ["expression"],
  },
  execute: async (args) => {
    const expr = String(args.expression ?? "");
    // Safe math eval — only allow alphanumerics, basic operators, parens, dots, spaces
    if (!/^[\d+\-*/().,%^ a-zA-Z_]+$/.test(expr)) {
      return { error: "Only basic math expressions are supported" };
    }
    // eslint-disable-next-line no-new-func
    let safe = expr.replace(/\^/g, "**");
    // Allow common math functions + constants via the Math namespace
    safe = safe.replace(/\b(Math\.|sqrt|sin|cos|tan|log|exp|pi|e|abs|pow|min|max)\b/g, (m) => {
      if (m === "pi") return "Math.PI";
      if (m === "e") return "Math.E";
      if (m === "sqrt") return "Math.sqrt";
      if (m === "sin") return "Math.sin";
      if (m === "cos") return "Math.cos";
      if (m === "tan") return "Math.tan";
      if (m === "log") return "Math.log";
      if (m === "exp") return "Math.exp";
      if (m === "abs") return "Math.abs";
      if (m === "pow") return "Math.pow";
      if (m === "min") return "Math.min";
      if (m === "max") return "Math.max";
      return m;
    });
    try {
      const result = Function(`"use strict"; return (${safe});`)();
      return { result: typeof result === "number" ? result : Number(result) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
});

export {};