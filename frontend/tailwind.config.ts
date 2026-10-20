import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        brand: {
          DEFAULT: "var(--brand)",
          light: "var(--brand-light)",
          50:  "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#1E1B4B",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        pastel: {
          blue: {
            bg: "var(--pastel-blue-bg)",
            acc: "var(--pastel-blue-acc)",
          },
          green: {
            bg: "var(--pastel-green-bg)",
            acc: "var(--pastel-green-acc)",
          },
          red: {
            bg: "var(--pastel-red-bg)",
            acc: "var(--pastel-red-acc)",
          },
          amber: {
            bg: "var(--pastel-amber-bg)",
            acc: "var(--pastel-amber-acc)",
          },
          violet: {
            bg: "var(--pastel-violet-bg)",
            acc: "var(--pastel-violet-acc)",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
        input: "var(--radius-input)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glass: "var(--shadow-glass)",
      },
    },
  },
  plugins: [],
};
export default config;
