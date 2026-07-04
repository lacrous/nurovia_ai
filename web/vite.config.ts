import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          "react-three": ["@react-three/fiber", "@react-three/drei"],
        },
        // Avoid eager modulepreload for the Three.js bundle — it's only used on the landing page
        // Lazy chunks still load on demand via dynamic import.
      },
    },
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Don't preload Three.js / react-three chunks — they're only used on the landing page
        if (filename.includes("three") || filename.includes("react-three")) {
          return [];
        }
        return deps;
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})