"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function AppleGlobalNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#000000] text-[#ffffff] h-[44px] border-b border-[#333333]/40">
      <div className="max-w-[1024px] mx-auto h-full px-4 flex items-center justify-between text-[12px] font-normal tracking-[-0.01em]">
        {/* Apple-style Logo mark */}
        <Link
          href="/"
          className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity"
          title="Cirra"
        >
          <img
            src="/cirra-logo.png"
            alt="Cirra"
            className="w-5 h-5 rounded-full object-cover shadow-sm"
          />
          <span className="font-semibold tracking-tight text-[13px] text-[#ffffff]">Cirra</span>
        </Link>

        {/* Global Links (Apple cadence) */}
        <div className="hidden md:flex items-center gap-7 text-[#d6d6d6]">
          <a href="#overview" className="hover:text-[#ffffff] transition-colors">
            Overview
          </a>
          <a href="#sentinel" className="hover:text-[#ffffff] transition-colors">
            Sentinel
          </a>
          <a href="#actions" className="hover:text-[#ffffff] transition-colors">
            Action Center
          </a>
          <a href="#ledger" className="hover:text-[#ffffff] transition-colors">
            Savings Ledger
          </a>
          <a href="#connectors" className="hover:text-[#ffffff] transition-colors">
            Connectors
          </a>
          <a href="#specs" className="hover:text-[#ffffff] transition-colors">
            Specs
          </a>
          <Link href="/dashboard" className="text-[#2997ff] hover:underline transition-all">
            Console
          </Link>
        </div>

        {/* Right Utility Cluster */}
        <div className="flex items-center gap-4 text-[#d6d6d6]">
          <Link
            href="/login"
            className="hidden sm:inline-block text-[12px] hover:text-[#ffffff] transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center justify-center text-[12px] bg-[#0066cc] text-[#ffffff] px-3 py-1 rounded-full hover:bg-[#0071e3] apple-btn-active transition-all"
          >
            Run free audit
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#d6d6d6] hover:text-[#ffffff] p-1"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#000000] border-b border-[#333333] px-6 py-4 space-y-3 text-[14px] text-[#d6d6d6]">
          <a
            href="#overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Overview
          </a>
          <a
            href="#sentinel"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Sentinel Anomaly Detection
          </a>
          <a
            href="#actions"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Action Center
          </a>
          <a
            href="#ledger"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Savings Ledger
          </a>
          <a
            href="#connectors"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Connectors
          </a>
          <a
            href="#specs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 hover:text-[#ffffff]"
          >
            Technical Specs
          </a>
          <div className="pt-3 border-t border-[#333333] flex flex-col gap-2">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 rounded-full bg-[#0066cc] text-[#ffffff] font-medium"
            >
              Run free audit
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 rounded-full border border-[#444444] text-[#ffffff] font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
