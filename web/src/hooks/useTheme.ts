import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Accent = "gold" | "blue" | "emerald" | "purple" | "rose";

const THEME_STORAGE_KEY = "nurovia-ai-theme";
const ACCENT_STORAGE_KEY = "nurovia-ai-accent";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // ignore
  }
  return "system";
}

function readStoredAccent(): Accent {
  if (typeof window === "undefined") return "gold";
  try {
    const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (raw === "gold" || raw === "blue" || raw === "emerald" || raw === "purple" || raw === "rose") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "gold";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved: ResolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
}

export function applyCustomAccent(hsl: string | null) {
  if (typeof document === "undefined") return;
  if (hsl) {
    const m = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
    if (m) {
      document.documentElement.setAttribute("data-accent-custom", hsl);
      document.documentElement.style.setProperty("--accent-h", m[1] ?? "");
      document.documentElement.style.setProperty("--accent-s", (m[2] ?? "0") + "%");
      document.documentElement.style.setProperty("--accent-l", (m[3] ?? "0") + "%");
    }
  } else {
    document.documentElement.removeAttribute("data-accent-custom");
    document.documentElement.style.removeProperty("--accent-h");
    document.documentElement.style.removeProperty("--accent-s");
    document.documentElement.style.removeProperty("--accent-l");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme
  );
  const [accent, setAccentState] = useState<Accent>(() => readStoredAccent());

  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(theme === "system" ? getSystemTheme() : theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      // ignore
    }
  }, [accent]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
      setResolvedTheme(getSystemTheme());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      if (prev === "system") return "dark";
      if (prev === "dark") return "light";
      return "system";
    });
  }, []);

  const setAccent = useCallback((a: Accent) => setAccentState(a), []);
  const setCustomAccent = useCallback((hsl: string | null) => {
    applyCustomAccent(hsl);
    try {
      if (hsl) localStorage.setItem("nurovia-ai-accent-custom", hsl);
      else localStorage.removeItem("nurovia-ai-accent-custom");
    } catch {
      // ignore
    }
  }, []);

  return { theme, resolvedTheme, setTheme, toggle, accent, setAccent, setCustomAccent } as const;
}