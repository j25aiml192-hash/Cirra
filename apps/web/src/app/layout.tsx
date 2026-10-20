import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Cirra | Cloud & AI Cost Control Plane",
  description: "Unified FinOps and AI Cost Governance platform for modern engineering teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 dark:bg-[#080d1a] font-sans antialiased text-slate-900 dark:text-slate-100">
        <Providers>
          {children}
          {/* Global toast notification anchor */}
          <div id="toast-container" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
        </Providers>
      </body>
    </html>
  );
}
