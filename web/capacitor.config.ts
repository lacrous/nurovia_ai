import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.nurovia.app",
  appName: "Nurovia AI",
  webDir: "dist",
  bundledWebRuntime: false,
  // Background color matches our dark theme
  backgroundColor: "#0a0a0c",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0c",
    buildOptions: {
      // For App Store distribution
      developmentTeam: "",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0a0a0c",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "small",
      spinnerColor: "#D4AF37",
      splashFullScreen: false,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0c",
      overlaysWebView: false,
    },
  },
};

export default config;