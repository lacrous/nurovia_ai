import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LayoutDashboard, MessageCircle, CreditCard, BookOpen, HelpCircle, History, Activity, Building2 } from "lucide-react";
import { NavDropdown, type NavItem } from "./NavDropdown";
import { Logo } from "./Logo";
import { AnimatedBackground } from "./AnimatedBackground";
import { ErrorBoundary } from "./ErrorBoundary";
import { ThemeToggle } from "./ThemeToggle";

import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  minimalNav?: boolean;
}



function PageNavLinks({ onNavigate, includeLandingAnchors = false }: { onNavigate?: () => void; includeLandingAnchors?: boolean }) {
  const productItems: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", description: "Your chats, sessions & usage", icon: LayoutDashboard },
    { to: "/chat", label: "Chat", description: "Open the council workspace", icon: MessageCircle },
    { to: "/pricing", label: "Pricing", description: "Plans for individuals & teams", icon: CreditCard, badge: "Pro" },
    { to: "/changelog", label: "Changelog", description: "What shipped this week", icon: History },
  ];
  const resourcesItems: NavItem[] = [
    { to: "/docs", label: "Documentation", description: "API & feature reference", icon: BookOpen },
    { to: "/help", label: "Help center", description: "Searchable FAQ & guides", icon: HelpCircle },
    { to: "/status", label: "Status", description: "Provider uptime & incidents", icon: Activity },
  ];
  const companyItems: NavItem[] = [
    { to: "/about", label: "About", description: "Who we are and why we built this", icon: Building2 },
  ];
  return (
    <div className="hidden md:flex items-center gap-5">
      {includeLandingAnchors && (
        <>
          <a
            href="#features"
            onClick={onNavigate}
            className="text-[13px] text-muted-foreground hover:text-gold transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={onNavigate}
            className="text-[13px] text-muted-foreground hover:text-gold transition-colors"
          >
            How it works
          </a>
        </>
      )}
      <NavDropdown label="Product" items={productItems} onNavigate={onNavigate} />
      <NavDropdown label="Resources" items={resourcesItems} onNavigate={onNavigate} />
      <NavDropdown label="Company" items={companyItems} onNavigate={onNavigate} />
    </div>
  );
}

function AuthLinks() {
  return (
    <div className="hidden sm:flex items-center gap-2">
      <Link to="/signin" className="text-[13px] text-muted-foreground hover:text-gold transition-colors px-3 py-2">
        Log in
      </Link>
      <Link to="/signup" className="text-[13px] font-semibold bg-gold text-white hover:bg-gold-light px-4 py-2 rounded-xl transition-colors">
        Join beta
      </Link>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isLanding = pathname === "/";
  const groups: Array<{ title: string; items: { to: string; label: string }[] }> = [
    {
      title: "Product",
      items: [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/chat", label: "Chat" },
        { to: "/pricing", label: "Pricing" },
        { to: "/changelog", label: "Changelog" },
      ],
    },
    {
      title: "Resources",
      items: [
        { to: "/docs", label: "Documentation" },
        { to: "/help", label: "Help center" },
        { to: "/status", label: "Status" },
      ],
    },
    {
      title: "Company",
      items: [
        { to: "/about", label: "About" },
      ],
    },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="md:hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="mobile-panel"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-14 left-0 right-0 bg-panel border-b border-theme/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
        <nav className="px-4 py-3 flex flex-col gap-1">
          {isLanding && (
            <>
              <a
                href="#features"
                onClick={onClose}
                className="px-3 py-2.5 rounded-lg text-[14px] txt-body hover:bg-surface"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={onClose}
                className="px-3 py-2.5 rounded-lg text-[14px] txt-body hover:bg-surface"
              >
                How it works
              </a>
            </>
          )}
          {groups.map((group, i) => (
            <details key={group.title} open={i === 0} className="group/round">
              <summary className={`px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-between cursor-pointer ${
                group.items.some((it) => pathname === it.to) ? "text-gold" : "txt-faint"
              }`}>
                {group.title}
                <ChevronDown className="w-3 h-3 transition-transform group-open/round:rotate-180" />
              </summary>
              <div className="flex flex-col gap-0.5 mt-1 mb-2 pl-1">
                {group.items.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={onClose}
                    className={`px-3 py-2 rounded-lg text-[13.5px] ${
                      pathname === it.to ? "bg-gold/10 text-gold" : "txt-body hover:bg-surface"
                    }`}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <div className="h-px bg-theme/20 my-2" />
          <Link
            to="/chat"
            onClick={onClose}
            className="px-3 py-2.5 rounded-lg bg-gold text-white text-[13px] font-semibold text-center"
          >
            Open chat
          </Link>
          {!user && (
            <>
              <Link to="/signin" onClick={onClose} className="px-3 py-2.5 rounded-lg txt-body text-[13px] hover:bg-surface">
                Log in
              </Link>
              <Link to="/signup" onClick={onClose} className="px-3 py-2.5 rounded-lg txt-body text-[13px] hover:bg-surface">
                Join beta
              </Link>
            </>
          )}
        </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MarketingFooter() {
  return (
    <footer className="py-12 px-4 border-t border-theme/20 bg-panel/30">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Logo />
          <p className="text-[13px] txt-muted mt-4 max-w-sm leading-relaxed">
            Autonomous coding intelligence that debates, validates, and safely applies fixes to your codebase.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Link to="/signin" className="text-[11px] txt-muted hover:text-gold">Sign in</Link>
            <span className="txt-faint">·</span>
            <Link to="/signup" className="text-[11px] txt-muted hover:text-gold">Join beta</Link>
          </div>
        </div>
        <div>
          <h4 className="text-[12px] font-semibold mb-3">Product</h4>
          <div className="flex flex-col gap-2">
            <Link to="/dashboard" className="text-[13px] txt-muted hover:text-gold transition-colors">Dashboard</Link>
            <Link to="/pricing" className="text-[13px] txt-muted hover:text-gold transition-colors">Pricing</Link>
            <Link to="/docs" className="text-[13px] txt-muted hover:text-gold transition-colors">Docs</Link>
            <Link to="/changelog" className="text-[13px] txt-muted hover:text-gold transition-colors">Changelog</Link>
            <Link to="/status" className="text-[13px] txt-muted hover:text-gold transition-colors">Status</Link>
          </div>
        </div>
        <div>
          <h4 className="text-[12px] font-semibold mb-3">Company</h4>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="text-[13px] txt-muted hover:text-gold transition-colors">About</Link>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Blog</a>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Careers</a>
            <a href="#" className="text-[13px] txt-muted hover:text-gold transition-colors">Contact</a>
          </div>
        </div>
        <div>
          <h4 className="text-[12px] font-semibold mb-3">Legal</h4>
          <div className="flex flex-col gap-2">
            <Link to="/privacy" className="text-[13px] txt-muted hover:text-gold transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-[13px] txt-muted hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-theme/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] txt-faint">© {new Date().getFullYear()} Nurovia AI. All rights reserved.</p>
        <p className="text-[10px] txt-faint">
          Made for developers who ship.
        </p>
      </div>
    </footer>
  );
}

export function Layout({ children, showNavbar = true, showFooter = true, minimalNav = false }: LayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground relative flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AnimatedBackground />
          {showNavbar && (
            <nav className="fixed top-0 left-0 right-0 z-50 h-14 min-h-[56px] border-b border-theme/20 bg-surface/70 backdrop-blur-md">
              <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
                <Logo onNavigate={() => setMobileOpen(false)} />
                {minimalNav ? null : <PageNavLinks onNavigate={() => setMobileOpen(false)} includeLandingAnchors={isLanding} />}
                <div className="flex items-center gap-2 sm:gap-3">
                  <ThemeToggle />
                  {isLanding && <AuthLinks />}
                  {!isLanding && (
                    <Link
                      to="/chat"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold text-white text-[12px] font-semibold hover:bg-gold-light transition-colors"
                    >
                      Open chat
                    </Link>
                  )}
                  <button
                    className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-surface hover:text-gold"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
            </nav>
          )}
          <div id="main-content" className={(showNavbar ? "pt-14" : "") + " flex-1"} role="main">{children}</div>
          {showFooter && !isLanding && <MarketingFooter />}
      </div>
    </ErrorBoundary>
  );
}