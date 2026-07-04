/**
 * Native bridge — gracefully no-ops on web, uses Capacitor plugins on iOS/Android.
 * Detection via Capacitor.isNativePlatform(); the plugins are tree-shaken on web.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const platform = (): "ios" | "android" | "web" =>
  (Capacitor.getPlatform() as "ios" | "android" | "web") || "web";

let hapticsMod: typeof import("@capacitor/haptics") | null = null;
let keyboardMod: typeof import("@capacitor/keyboard") | null = null;
let statusBarMod: typeof import("@capacitor/status-bar") | null = null;
let splashMod: typeof import("@capacitor/splash-screen") | null = null;
let appMod: typeof import("@capacitor/app") | null = null;

async function ensureHaptics() {
  if (!isNative() || hapticsMod) return hapticsMod;
  hapticsMod = await import("@capacitor/haptics");
  return hapticsMod;
}
async function ensureKeyboard() {
  if (!isNative() || keyboardMod) return keyboardMod;
  keyboardMod = await import("@capacitor/keyboard");
  return keyboardMod;
}
async function ensureStatusBar() {
  if (!isNative() || statusBarMod) return statusBarMod;
  statusBarMod = await import("@capacitor/status-bar");
  return statusBarMod;
}
async function ensureSplash() {
  if (!isNative() || splashMod) return splashMod;
  splashMod = await import("@capacitor/splash-screen");
  return splashMod;
}
async function ensureApp() {
  if (!isNative() || appMod) return appMod;
  appMod = await import("@capacitor/app");
  return appMod;
}

export async function hapticImpact(style: "light" | "medium" | "heavy" = "light") {
  const mod = await ensureHaptics();
  if (!mod) return;
  try {
    const map = {
      light: mod.ImpactStyle.Light,
      medium: mod.ImpactStyle.Medium,
      heavy: mod.ImpactStyle.Heavy,
    } as const;
    await mod.Haptics.impact({ style: map[style] });
  } catch {
    // ignore
  }
}

export async function hapticNotification(type: "success" | "warning" | "error" = "success") {
  const mod = await ensureHaptics();
  if (!mod) return;
  try {
    const map = {
      success: mod.NotificationType.Success,
      warning: mod.NotificationType.Warning,
      error: mod.NotificationType.Error,
    } as const;
    await mod.Haptics.notification({ type: map[type] });
  } catch {
    // ignore
  }
}

export async function keyboardHide() {
  const mod = await ensureKeyboard();
  if (!mod) return;
  try {
    await mod.Keyboard.hide();
  } catch {
    // ignore
  }
}

export async function setStatusBarStyleDark() {
  const mod = await ensureStatusBar();
  if (!mod) return;
  try {
    await mod.StatusBar.setStyle({ style: mod.Style.Dark });
    await mod.StatusBar.setBackgroundColor({ color: "#0a0a0c" });
  } catch {
    // ignore
  }
}

export async function hideSplashScreen() {
  const mod = await ensureSplash();
  if (!mod) return;
  try {
    await mod.SplashScreen.hide();
  } catch {
    // ignore
  }
}

export async function appAddListener(
  event: "appStateChange" | "pause" | "resume",
  handler: (state: unknown) => void
): Promise<{ remove: () => void }> {
  const mod = await ensureApp();
  if (!mod) return { remove: () => {} };
  try {
    const handle = await (mod.App.addListener as (e: string, h: unknown) => Promise<{ remove: () => void }>)(event, handler);
    return { remove: () => handle.remove() };
  } catch {
    return { remove: () => {} };
  }
}

export async function onBackButton(handler: () => void) {
  const mod = await ensureApp();
  if (!mod) return { remove: () => {} };
  try {
    return await (mod.App.addListener as (e: string, h: unknown) => Promise<{ remove: () => void }>)("backButton", handler);
  } catch {
    return { remove: () => {} };
  }
}