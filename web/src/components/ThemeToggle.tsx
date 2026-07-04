import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";

  const label =
    theme === "system"
      ? "Switch to dark mode"
      : isDark
      ? "Switch to light mode"
      : "Switch to system mode";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-foreground/70 hover:text-gold hover:bg-surface border border-transparent hover:border-theme/40 transition-colors"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute"
      >
        <Moon className="w-[18px] h-[18px]" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? -180 : 0, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        className="absolute"
      >
        <Sun className="w-[18px] h-[18px]" />
      </motion.div>
      {theme === "system" && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold border-2 border-background" />
      )}
    </button>
  );
}
