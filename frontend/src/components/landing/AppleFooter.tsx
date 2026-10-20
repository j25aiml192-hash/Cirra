"use client";

import * as React from "react";
import Link from "next/link";

export function AppleFooter() {
  return (
    <footer className="w-full bg-[#f5f5f7] text-[#333333] border-t border-[#e0e0e0] py-16 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-[12px] text-[#7a7a7a]">
        {/* Footnote Disclaimers */}
        <div className="space-y-2 pb-8 border-b border-[#e0e0e0] leading-[1.33]">
          <p>
            1. Anomaly detection latencies and blast-radius prevention estimates are calculated against synthetic burst scenarios comparing 15-minute continuous sampling against 24-hour batch billing exports.
          </p>
          <p>
            2. FOCUS 1.0 (FinOps Open Cost &amp; Usage Specification) compliance is validated against standard AWS CUR 2.0, Google Cloud BigQuery, and Microsoft Azure exports.
          </p>
          <p>
            3. Cirra is not affiliated with AWS, Google Cloud, Microsoft, OpenAI, or Anthropic. All brand trademarks remain the property of their respective holders.
          </p>
        </div>

        {/* 5-Column Navigation Grid with Relaxed 2.41 leading */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 py-10 border-b border-[#e0e0e0]">
          {/* Column 1 */}
          <div>
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Pillars</h4>
            <ul className="text-[14px] text-[#474749] space-y-2.5">
              <li>
                <a href="#overview" className="hover:text-[#1d1d1f] transition-colors">
                  SEE: Multi-Cloud
                </a>
              </li>
              <li>
                <a href="#sentinel" className="hover:text-[#1d1d1f] transition-colors">
                  GUARD: Sentinel
                </a>
              </li>
              <li>
                <a href="#actions" className="hover:text-[#1d1d1f] transition-colors">
                  ACT: Action Center
                </a>
              </li>
              <li>
                <a href="#ledger" className="hover:text-[#1d1d1f] transition-colors">
                  PROVE: Savings Ledger
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#1d1d1f] transition-colors">
                  Ask Cirra AI Copilot
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Connectors</h4>
            <ul className="text-[14px] text-[#474749] space-y-2.5">
              <li>
                <a href="#connectors" className="hover:text-[#1d1d1f] transition-colors">
                  AWS CUR 2.0
                </a>
              </li>
              <li>
                <a href="#connectors" className="hover:text-[#1d1d1f] transition-colors">
                  Google Cloud
                </a>
              </li>
              <li>
                <a href="#connectors" className="hover:text-[#1d1d1f] transition-colors">
                  Microsoft Azure
                </a>
              </li>
              <li>
                <a href="#connectors" className="hover:text-[#1d1d1f] transition-colors">
                  OpenAI API
                </a>
              </li>
              <li>
                <a href="#connectors" className="hover:text-[#1d1d1f] transition-colors">
                  Anthropic Claude
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Solutions</h4>
            <ul className="text-[14px] text-[#474749] space-y-2.5">
              <li>
                <span className="text-[#1d1d1f]">Priya:</span> Platform &amp; DevOps
              </li>
              <li>
                <span className="text-[#1d1d1f]">Arjun:</span> CTO &amp; VP Eng
              </li>
              <li>
                <span className="text-[#1d1d1f]">Meera:</span> CFO &amp; Finance
              </li>
              <li>
                <span className="text-[#1d1d1f]">Sam:</span> SRE &amp; On-Call
              </li>
              <li>
                <span className="text-[#474749]">Enterprise FinOps</span>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Security</h4>
            <ul className="text-[14px] text-[#474749] space-y-2.5">
              <li>
                <a href="#specs" className="hover:text-[#1d1d1f] transition-colors">
                  Postgres RLS Policy
                </a>
              </li>
              <li>
                <a href="#specs" className="hover:text-[#1d1d1f] transition-colors">
                  AES-256-GCM Encryption
                </a>
              </li>
              <li>
                <span className="text-[#474749]">Read-Only IAM Roles</span>
              </li>
              <li>
                <span className="text-[#474749]">SOC2 Type II Attestation</span>
              </li>
              <li>
                <span className="text-[#474749]">Privacy Overview</span>
              </li>
            </ul>
          </div>

          {/* Column 5 */}
          <div>
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Cirra Account</h4>
            <ul className="text-[14px] text-[#474749] space-y-2.5">
              <li>
                <Link href="/dashboard" className="hover:text-[#1d1d1f] transition-colors">
                  Launch Console
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#1d1d1f] transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/j25aiml192-hash/Cirra"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1d1d1f] transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[#7a7a7a]">
          <div className="flex items-center gap-2.5">
            <img src="/cirra-logo.png" alt="Cirra" className="h-5 w-5 rounded-full object-contain" />
            <span>Copyright &copy; {new Date().getFullYear()} Cirra Technologies Inc. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#7a7a7a]">
            <span className="hover:text-[#1d1d1f] cursor-pointer">Privacy Policy</span>
            <span>|</span>
            <span className="hover:text-[#1d1d1f] cursor-pointer">Terms of Use</span>
            <span>|</span>
            <span className="hover:text-[#1d1d1f] cursor-pointer">Sales Policy</span>
            <span>|</span>
            <span className="hover:text-[#1d1d1f] cursor-pointer">Legal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
