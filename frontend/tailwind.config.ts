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
        foreground: "#0A192F",
        background: "#050B18",
        border: "rgba(255, 255, 255, 0.12)",
        primary: "#0A192F",
        secondary: "#38BDF8",
        destructive: "#EF4444",
        "muted-foreground": "#475569",
        page: "#DBE6E7",
        surface: "#FFFFFF",
        navy: {
          DEFAULT: "#0A192F",
          900: "#0A192F",
          800: "#0F1E36",
          700: "#1E3048",
          600: "#324864",
          500: "#4A607A",
          400: "#7E93AB",
        },
        cardborder: {
          DEFAULT: "#D6E4F5",
          hover: "#BCD4F0",
        },
        brand: {
          DEFAULT: "#0062E0",
          action: "#0062E0",
          focus: "#0070F3",
          light: "#E8F2FE",
          border: "#BCD9FC",
          50:  "#E8F2FE",
          100: "#D3E5FD",
          500: "#0070F3",
          600: "#0062E0",
          700: "#004EB8",
          900: "#002A66",
        },
        provider: {
          aws: "#F58536",
          gcp: "#1A73E8",
          openai: "#10A37F",
          anthropic: "#9333EA",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Plus Jakarta Sans",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        btn: "10px",
        input: "8px",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(12, 48, 96, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 10px 32px -6px rgba(12, 48, 96, 0.10), 0 2px 6px rgba(0, 0, 0, 0.03)",
        soft: "0 2px 10px -2px rgba(12, 45, 90, 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
