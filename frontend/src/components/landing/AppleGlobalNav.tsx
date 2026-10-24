"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function AppleGlobalNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    setMobileMenuOpen(false);
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `#${targetId}`);
        }
      }, 50);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 text-[#0A192F] h-[52px] border-b border-[#E8EFF7] backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto h-full px-6 sm:px-12 flex items-center justify-between text-[13px] font-medium tracking-[-0.01em]">
        {/* Apple-style Logo mark */}
        <Link
          href="/"
          className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity"
          title="Cirra"
        >
          <img
            src="/cirra-logo.png"
            alt=""
            aria-hidden="true"
            className="w-5 h-5 rounded-md object-contain"
          />
          <span className="font-semibold tracking-tight text-[13px] text-[#0A192F]">
            Cirra
          </span>
        </Link>

        {/* Global Links (Apple cadence) */}
        <div className="hidden md:flex items-center gap-7 text-[#475569]">
          <a
            href="/#overview"
            onClick={(e) => handleNavClick(e, "overview")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Overview
          </a>
          <a
            href="/#sentinel"
            onClick={(e) => handleNavClick(e, "sentinel")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Sentinel
          </a>
          <a
            href="/#actions"
            onClick={(e) => handleNavClick(e, "actions")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Action Center
          </a>
          <a
            href="/#ledger"
            onClick={(e) => handleNavClick(e, "ledger")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Savings Ledger
          </a>
          <a
            href="/#connectors"
            onClick={(e) => handleNavClick(e, "connectors")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Connectors
          </a>
          <a
            href="/#specs"
            onClick={(e) => handleNavClick(e, "specs")}
            className="hover:text-[#0A192F] transition-colors"
          >
            Specs
          </a>
          <Link href="/dashboard" className="text-[#0062E0] hover:underline transition-all font-medium">
            Console
          </Link>
        </div>

        {/* Right Utility Cluster */}
        <div className="flex items-center gap-4 text-[#475569]">
          <Link
            href="/login"
            className="hidden sm:inline-block text-[12px] hover:text-[#0A192F] transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center justify-center text-[12px] bg-[#0062E0] text-white px-3 py-1 rounded-full hover:bg-[#0052C2] apple-btn-active transition-all"
          >
            Run free audit
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#475569] hover:text-[#0A192F] p-1"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D6E4F5] px-6 py-4 space-y-3 text-[14px] text-[#475569] shadow-md">
          <a
            href="/#overview"
            onClick={(e) => handleMobileNavClick(e, "overview")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Overview
          </a>
          <a
            href="/#sentinel"
            onClick={(e) => handleMobileNavClick(e, "sentinel")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Sentinel Anomaly Detection
          </a>
          <a
            href="/#actions"
            onClick={(e) => handleMobileNavClick(e, "actions")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Action Center
          </a>
          <a
            href="/#ledger"
            onClick={(e) => handleMobileNavClick(e, "ledger")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Savings Ledger
          </a>
          <a
            href="/#connectors"
            onClick={(e) => handleMobileNavClick(e, "connectors")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Connectors
          </a>
          <a
            href="/#specs"
            onClick={(e) => handleMobileNavClick(e, "specs")}
            className="block py-1 hover:text-[#0A192F]"
          >
            Technical Specs
          </a>
          <div className="pt-3 border-t border-[#D6E4F5] flex flex-col gap-2">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 rounded-full bg-[#0062E0] text-white font-medium"
            >
              Run free audit
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 rounded-full border border-[#D6E4F5] text-[#0A192F] font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
