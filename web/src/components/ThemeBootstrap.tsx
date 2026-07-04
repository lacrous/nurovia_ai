/**
 * ThemeBootstrap — runs once on app boot to read stored accent + theme
 * and apply them, so the page paints with the right colors from first frame.
 * No UI, no re-renders — pure imperative setup.
 */
import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

export function ThemeBootstrap() {
  const { theme, accent } = useTheme();
  useEffect(() => {
    // useTheme already applies on mount via its own effects; this is purely
    // here so the hook gets called at the very top of the tree.
    document.documentElement.setAttribute("data-theme-boot", String(theme));
    document.documentElement.setAttribute("data-accent-boot", String(accent));
  }, [theme, accent]);
  return null;
}