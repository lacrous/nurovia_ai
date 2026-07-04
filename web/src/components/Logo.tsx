import { Link } from "react-router-dom";

export function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 group">
      <img
        src="/logo-icon.svg"
        alt=""
        className="w-7 h-7 group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all"
      />
      <span className="text-[16px] font-bold text-gold tracking-tight">Nurovia AI</span>
    </Link>
  );
}