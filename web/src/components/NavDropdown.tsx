import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface NavItem {
  label: string;
  description?: string;
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  onNavigate?: () => void;
}

/**
 * NavDropdown — desktop navbar dropdown with hover + keyboard support.
 * Closes on outside click, Escape, or route change.
 */
export function NavDropdown({ label, items, onNavigate }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Determine if any child is active
  const isActive = items.some((it) => pathname === it.to || pathname.startsWith(it.to + "/"));

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 text-[13px] transition-colors ${
          isActive || open ? "text-gold" : "text-muted-foreground hover:text-gold"
        }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
            role="menu"
          >
            <div className="min-w-[260px] rounded-xl border border-theme/30 bg-panel/95 backdrop-blur-md shadow-2xl p-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    role="menuitem"
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                      active ? "bg-gold/10" : "hover:bg-surface"
                    }`}
                  >
                    {Icon && (
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        active ? "bg-gold/20 text-gold" : "bg-surface text-muted-foreground group-hover:text-gold"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-semibold ${active ? "text-gold" : "txt-head"}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/15 text-gold uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] txt-muted mt-0.5 leading-snug">{item.description}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}