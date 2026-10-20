import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--color-brand-50, #eef2ff)",
          100: "var(--color-brand-100, #e0e7ff)",
          200: "var(--color-brand-200, #c7d2fe)",
          300: "var(--color-brand-300, #a5b4fc)",
          400: "var(--color-brand-400, #818cf8)",
          500: "var(--color-brand-500, #6366f1)",
          600: "var(--color-brand-600, #4f46e5)",
          700: "var(--color-brand-700, #4338ca)",
          800: "var(--color-brand-800, #3730a3)",
          900: "var(--color-brand-900, #312e81)",
          950: "var(--color-brand-950, #1e1b4b)",
        },
        surface: {
          DEFAULT: "var(--color-surface, #ffffff)",
          raised: "var(--color-surface-raised, #f8fafc)",
        },
        border: "var(--color-border, #e2e8f0)",
        text: {
          primary: "var(--color-text-primary, #0f172a)",
          muted: "var(--color-text-muted, #64748b)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
