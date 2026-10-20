import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cirra.cloud"),
  title: "Cirra — Unified Cloud & AI Cost Control Plane",
  description:
    "See and control AWS, GCP, Azure, Kubernetes, OpenAI, and Anthropic spend in one unified platform. Real-time FOCUS attribution, anomaly guardrails, and proven savings.",
  keywords: [
    "FinOps",
    "Cloud Cost Optimization",
    "AI Cost Management",
    "FOCUS 1.0",
    "LLM Token Attribution",
    "AWS Cost Control",
    "OpenAI Spend Tracking",
  ],
  authors: [{ name: "Cirra Technologies" }],
  creator: "Cirra Technologies",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cirra.cloud",
    title: "Cirra — Unified Cloud & AI Cost Control Plane",
    description: "One place to see and control your cloud and AI spend. See it. Guard it. Act on it. Prove it.",
    siteName: "Cirra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cirra — Unified Cloud & AI Cost Control Plane",
    description: "One place to see and control your cloud and AI spend. See it. Guard it. Act on it. Prove it.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
