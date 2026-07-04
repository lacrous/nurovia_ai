/**
 * Code execution sandbox — runs Python in the browser via Pyodide.
 * Pyodide loads the CPython interpreter as a WebAssembly module
 * from a CDN. No server required.
 */

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

interface PyodideRuntime {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (cfg: { batched?: (s: string) => void }) => void;
  setStderr: (cfg: { batched?: (s: string) => void }) => void;
  globals: { get: (name: string) => unknown };
}

let pyodideInstance: PyodideRuntime | null = null;
let loadingPromise: Promise<PyodideRuntime> | null = null;

export async function loadPython(): Promise<PyodideRuntime> {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${PYODIDE_URL}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load Pyodide from CDN. Are you offline?"));
        document.head.appendChild(script);
      });
    }
    const runtime = await window.loadPyodide!({ indexURL: PYODIDE_URL });
    pyodideInstance = runtime;
    return runtime;
  })();
  return loadingPromise;
}

export async function runPython(code: string): Promise<{ stdout: string; stderr: string; result?: unknown }> {
  const py = await loadPython();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s: string) => (stdout += s + "\n") });
  py.setStderr({ batched: (s: string) => (stderr += s + "\n") });
  try {
    const result = await py.runPythonAsync(code);
    return { stdout, stderr, result: typeof result === "string" || typeof result === "number" ? result : undefined };
  } catch (err) {
    return { stdout, stderr: stderr + String(err), result: undefined };
  }
}