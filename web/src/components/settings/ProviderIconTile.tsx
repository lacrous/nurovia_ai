import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { type ProviderInfo } from "../../services/api";
import { ProviderLogo } from "./providerLogos";

interface ProviderIconTileProps {
  provider: ProviderInfo;
  configured: boolean;
  /** Index of the chosen default model in the catalogue (for ribbon label). */
  selectedModel?: string;
  onClick: () => void;
}

/**
 * Provider icon tile — compact, clickable, status-dot driven.
 * Uses each provider's real brand SVG (simple-icons / lobehub).
 */
export function ProviderIconTile({ provider, configured, selectedModel, onClick }: ProviderIconTileProps) {
  const isCustom = provider.id === "custom";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all text-left ${
        configured
          ? "border-gold/40 bg-gradient-to-b from-gold/10 to-transparent shadow-[0_4px_20px_-8px_rgba(var(--accent-rgb),0.4)]"
          : "border-theme/30 bg-surface/40 hover:border-gold/30 hover:bg-surface"
      }`}
    >
      {/* Logo container — white in both themes so brand colors stay true */}
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-theme/10 overflow-hidden">
        {isCustom ? (
          <Plus className="w-7 h-7 text-muted-foreground" />
        ) : (
          <ProviderLogo providerId={provider.id} size={32} />
        )}
      </div>

      <div className="text-center min-w-0 w-full">
        <p className="text-[12px] font-semibold txt-head truncate">{provider.name}</p>
        <p className="text-[10px] txt-faint mt-0.5 truncate">
          {configured
            ? selectedModel ?? provider.default_model
            : provider.requires_base_url
            ? "Key + URL"
            : "Not configured"}
        </p>
      </div>

      {/* Status dot */}
      <div className="absolute top-2 right-2">
        {configured ? (
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-500/50" />
        )}
      </div>

      {/* Configured ribbon */}
      {configured && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gold text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Check className="w-2.5 h-2.5" />
          Active
        </div>
      )}
    </motion.button>
  );
}
