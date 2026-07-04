import { motion } from "framer-motion";
import { MessageSquare, KeyRound } from "lucide-react";

/**
 * A set of animated SVG illustrations used as empty-state art.
 * Lightweight, animated subtly, themable via currentColor.
 */
interface IllustrationProps {
  className?: string;
}

export function EmptyChatIllustration({ className }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <rect x="40" y="40" width="120" height="80" rx="12" fill="url(#g1)" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="55" y1="62" x2="130" y2="62" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        <line x1="55" y1="76" x2="115" y2="76" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        <line x1="55" y1="90" x2="100" y2="90" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <motion.g
        animate={{ y: [0, 3, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      >
        <rect x="55" y="100" width="90" height="44" rx="10" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
        <line x1="65" y1="116" x2="120" y2="116" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="128" x2="105" y2="128" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <motion.circle
        cx="155"
        cy="45"
        r="6"
        fill="currentColor"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.svg>
  );
}

export function EmptySearchIllustration({ className }: IllustrationProps) {
  return (
    <motion.svg viewBox="0 0 200 160" className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.g
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 80px" }}
      >
        <circle cx="90" cy="70" r="36" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" />
        <line x1="116" y1="96" x2="148" y2="128" stroke="currentColor" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <motion.g animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
        <circle cx="80" cy="65" r="2" fill="currentColor" />
        <circle cx="100" cy="65" r="2" fill="currentColor" />
        <circle cx="90" cy="80" r="2" fill="currentColor" />
      </motion.g>
    </motion.svg>
  );
}

export function EmptyInboxIllustration({ className }: IllustrationProps) {
  return (
    <motion.svg viewBox="0 0 200 160" className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.path
        d="M 30 60 L 100 30 L 170 60 L 170 120 Q 170 130 160 130 L 40 130 Q 30 130 30 120 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <motion.rect
        x="65"
        y="90"
        width="70"
        height="34"
        rx="4"
        fill="currentColor"
        fillOpacity="0.15"
        animate={{ y: [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      />
    </motion.svg>
  );
}

export function EmptyKeysIllustration({ className }: IllustrationProps) {
  return (
    <motion.svg viewBox="0 0 200 160" className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 80px" }}
      >
        <circle cx="80" cy="80" r="22" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" />
        <line x1="102" y1="80" x2="150" y2="80" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <line x1="138" y1="80" x2="138" y2="92" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <line x1="148" y1="80" x2="148" y2="88" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="80" r="6" fill="currentColor" fillOpacity="0.3" />
      </motion.g>
    </motion.svg>
  );
}

interface EmptyStateProps {
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ illustration, icon, title, body, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      {illustration ? (
        <div className="text-gold w-48 h-40 mb-4">{illustration}</div>
      ) : icon ? (
        <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
          <div className="text-gold">{icon}</div>
        </div>
      ) : null}
      <p className="text-[14px] font-semibold txt-head">{title}</p>
      {body && <p className="text-[12px] txt-muted mt-1.5 max-w-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

// Convenience wrappers for the common cases
export function EmptyChat() {
  return (
    <EmptyState
      illustration={<EmptyChatIllustration className="w-full h-full" />}
      title="No messages yet"
      body="Type something below — or pick a slash command from the menu. The council will deliberate."
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      illustration={<EmptySearchIllustration className="w-full h-full" />}
      title={query ? `No matches for "${query}"` : "Start typing to search"}
      body="Search across session titles and message content. Highlighted matches are kept short for context."
    />
  );
}

export function EmptySessions() {
  return (
    <EmptyState
      illustration={<EmptyInboxIllustration className="w-full h-full" />}
      title="No chats yet"
      body="Start a new debug session to see it appear here."
    />
  );
}

export function EmptyKeys() {
  return (
    <EmptyState
      illustration={<EmptyKeysIllustration className="w-full h-full" />}
      title="No API keys yet"
      body="Add at least one provider key in Settings to start chatting. Keys stay in your browser."
      icon={<KeyRound className="w-6 h-6 text-gold" />}
    />
  );
}

export function GenericInbox({ title, body }: { title: string; body?: string }) {
  return (
    <EmptyState
      icon={<MessageSquare className="w-6 h-6 text-gold" />}
      title={title}
      body={body}
    />
  );
}