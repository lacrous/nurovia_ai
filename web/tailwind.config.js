/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        gold: {
          // Maps to the active accent via CSS variables — switching the accent
          // picker flips all gold-* classes across the app in real time.
          // The <alpha-value> placeholder is REQUIRED for utilities like
          // bg-gold/10 to actually apply opacity to the resolved HSL.
          DEFAULT: "hsl(var(--accent-h) var(--accent-s) var(--accent-l) / <alpha-value>)",
          dark: "hsl(var(--accent-h) var(--accent-s) calc(var(--accent-l) - 8%) / <alpha-value>)",
          light: "hsl(var(--accent-h) var(--accent-s) calc(var(--accent-l) + 10%) / <alpha-value>)",
          muted: "hsl(var(--accent-h) var(--accent-s) calc(var(--accent-l) + 30%) / <alpha-value>)",
        },
        nu: {
          50: "#F4F5F8",
          100: "#ECEEF2",
          200: "#D8DCE3",
          300: "#B0B8C4",
          400: "#8B95A5",
          500: "#5A6578",
          600: "#3D4552",
          700: "#2A3039",
          800: "#1E2229",
          900: "#141820",
          950: "#0D1016",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        panel: "hsl(var(--panel))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        theme: "hsl(var(--theme))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      screens: {
        xs: "480px",
      },
      borderRadius: {
        xs: "calc(var(--radius) - 8px)",
        sm: "calc(var(--radius) - 6px)",
        md: "calc(var(--radius) - 3px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        DEFAULT: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        md: "0 8px 16px -4px rgb(0 0 0 / 0.08)",
        lg: "0 12px 24px -6px rgb(0 0 0 / 0.12)",
        glow: "0 0 24px rgba(212, 175, 55, 0.18)",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
        300: "300ms",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.8s ease-out forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
