import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { AnimatedBackground } from "./AnimatedBackground";

/**
 * AuthLayout — clean, focused sign-in / sign-up screen.
 * No navbar, no footer — just a centered card on a soft gradient backdrop.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <AnimatedBackground />
      <header className="relative z-10 h-16 flex items-center px-6">
        <Link to="/" aria-label="Nurovia AI home">
          <Logo />
        </Link>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
      <footer className="relative z-10 py-4 px-6 text-center">
        <p className="text-[11px] txt-faint">
          © {new Date().getFullYear()} Nurovia AI · <Link to="/privacy" className="hover:text-gold">Privacy</Link> ·{" "}
          <Link to="/terms" className="hover:text-gold">Terms</Link>
        </p>
      </footer>
    </div>
  );
}