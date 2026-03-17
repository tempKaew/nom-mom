import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Legacy ───────────────── */
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* ── Brand ───────────────── */
        primary: {
          DEFAULT: "var(--color-primary)",
          fg:      "var(--color-primary-fg)",
        },

        /* ── Surface ─────────────── */
        "app-bg":  "var(--color-app-bg)",
        surface:   "var(--color-surface)",

        /* ── Text ────────────────── */
        "text-secondary": "var(--color-text-secondary)",
        "text-muted":     "var(--color-text-muted)",
        "text-subtle":    "var(--color-text-subtle)",

        /* ── Category ────────────── */
        feeding: {
          DEFAULT: "var(--color-feeding)",
          bg:      "var(--color-feeding-bg)",
          muted:   "var(--color-feeding-muted)",
        },
        diaper: {
          DEFAULT: "var(--color-diaper)",
          bg:      "var(--color-diaper-bg)",
          muted:   "var(--color-diaper-muted)",
        },
        sleep: {
          DEFAULT: "var(--color-sleep)",
          bg:      "var(--color-sleep-bg)",
          muted:   "var(--color-sleep-muted)",
        },
        medical: {
          DEFAULT: "var(--color-medical)",
          bg:      "var(--color-medical-bg)",
        },
      },
      fontFamily: {
        prompt: ["var(--font-prompt)", "sans-serif"],
        sarabun: ["var(--font-sarabun)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
