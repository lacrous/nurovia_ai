import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";
import { Layout } from "./components/Layout.tsx";
import { CommandPalette } from "./components/CommandPalette.tsx";
import { ShortcutsModal } from "./components/ShortcutsModal.tsx";
import { GlobalSettings } from "./components/GlobalSettings.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ToastProvider, ToastContainer } from "./components/ui";
import { ThemeBootstrap } from "./components/ThemeBootstrap.tsx";

// All routes lazy-loaded for code splitting
const App = lazy(() => import("./App.tsx").then((m) => ({ default: m.default })));
const SignIn = lazy(() => import("./pages/SignIn.tsx").then((m) => ({ default: m.SignIn })));
const SignUp = lazy(() => import("./pages/SignUp.tsx").then((m) => ({ default: m.SignUp })));
const Chat = lazy(() => import("./pages/Chat.tsx").then((m) => ({ default: m.Chat })));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx").then((m) => ({ default: m.Dashboard })));
const Docs = lazy(() => import("./pages/Docs.tsx").then((m) => ({ default: m.Docs })));
const About = lazy(() => import("./pages/About.tsx").then((m) => ({ default: m.About })));
const PricingPage = lazy(() => import("./pages/Pricing.tsx").then((m) => ({ default: m.PricingPage })));
const Privacy = lazy(() => import("./pages/Privacy.tsx").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Terms.tsx").then((m) => ({ default: m.Terms })));
const Changelog = lazy(() => import("./pages/Changelog.tsx").then((m) => ({ default: m.Changelog })));
const Status = lazy(() => import("./pages/Status.tsx").then((m) => ({ default: m.Status })));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx").then((m) => ({ default: m.Onboarding })));
const NotFound = lazy(() => import("./pages/NotFound.tsx").then((m) => ({ default: m.NotFound })));
const Share = lazy(() => import("./pages/Share.tsx").then((m) => ({ default: m.Share })));
const Admin = lazy(() => import("./pages/Admin.tsx").then((m) => ({ default: m.Admin })));
const Help = lazy(() => import("./pages/Help.tsx").then((m) => ({ default: m.Help })));

function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin mb-3" />
      <span className="text-[12px] txt-muted">{label}</span>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Suspense fallback={<PageLoader label="Loading Nurovia AI…" />}>
          <Routes location={location}>
            <Route path="/" element={<Layout><App /></Layout>} />

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/chat"
              element={
                <Layout showNavbar={false} showFooter={false}>
                  <Chat />
                </Layout>
              }
            />

            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />
            <Route path="/docs" element={<Layout><Docs /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/changelog" element={<Layout><Changelog /></Layout>} />
            <Route path="/status" element={<Layout><Status /></Layout>} />

            <Route path="/share/:encoded" element={<Layout><Share /></Layout>} />
            <Route path="/admin" element={<Layout><Admin /></Layout>} />
            <Route path="/help" element={<Layout><Help /></Layout>} />
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// Register service worker for offline shell + PWA install
// Global ⌘, shortcut — open settings from any page (Chat handles it too)
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "," && !e.shiftKey && !e.altKey) {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("nurovia:open-settings"));
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent failure — SW is a nice-to-have
    });
  });
}

// Initialize native bridge on iOS/Android — no-op on web
import("./lib/native").then(async (native) => {
  if (native.isNative()) {
    await native.hideSplashScreen();
    await native.setStatusBarStyleDark();
    native.onBackButton(() => {
      // On Android, hardware back navigates back
      if (window.location.pathname === "/") {
        // Exit app on second back press at root
        const lastBack = Number(localStorage.getItem("nurovia-ai-last-back") || "0");
        const now = Date.now();
        if (now - lastBack < 800) {
          import("@capacitor/app").then((m) => m.App.exitApp());
        } else {
          localStorage.setItem("nurovia-ai-last-back", String(now));
        }
      } else {
        window.history.back();
      }
    });
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <ThemeBootstrap />
            <CommandPalette />
            <ShortcutsModal />
            <GlobalSettings />
            <AnimatedRoutes />
            <ToastContainer />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);