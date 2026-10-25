"use client";

import * as React from "react";
import {
  PanelLeft,
  Search,
  Bell,
  AlertTriangle,
  Flame,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  showNavPills?: boolean;
}

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  severity: "critical" | "high" | "medium";
  unread: boolean;
  href: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: "alert-1",
    title: "AWS NAT Gateway Egress Spike",
    desc: "+$6,080 (+420%) unexpected transfer surge in us-east-1 VPC",
    time: "14m ago",
    severity: "critical",
    unread: true,
    href: "/anomalies",
  },
  {
    id: "alert-2",
    title: "OpenAI GPT-4o Token Runaway",
    desc: "+$8,600 prompt completion spike on key 'prod-copilot-svc'",
    time: "2h ago",
    severity: "high",
    unread: true,
    href: "/anomalies",
  },
  {
    id: "alert-3",
    title: "GCP BigQuery Unpartitioned Scan",
    desc: "18.5 TB ad-hoc query scanned without date filter",
    time: "Yesterday",
    severity: "medium",
    unread: true,
    href: "/anomalies",
  },
];

export function Topbar({ title, subtitle }: TopbarProps) {
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [showAlerts, setShowAlerts] = React.useState(false);
  const [alerts, setAlerts] = React.useState<AlertItem[]>(INITIAL_ALERTS);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => a.unread).length;

  const toggleSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cirra:toggle-sidebar"));
    }
  };

  // Close dropdown on outside click or Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAlerts(false);
      }
    };

    if (showAlerts) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAlerts]);

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })));
  };

  const dismissAlert = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <header className="flex items-center justify-between gap-3 h-14 px-4 sm:px-6 bg-[#07090E] border-b border-[#1A2333] sticky top-0 z-30 select-none text-white shadow-sm">
      {/* Left: Sidebar Toggle Button & Greeting Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors"
          title="Toggle sidebar (⌘B)"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <h1 className="text-[14px] sm:text-[15px] font-semibold text-white tracking-tight truncate">
            {title || "Welcome back, Hiten"}
          </h1>
          {subtitle && (
            <span className="hidden xl:inline-block text-xs text-zinc-400 font-normal truncate">
              · {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: Search, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Search Input / Trigger */}
        <div className="relative hidden md:block w-40 lg:w-52">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-full h-8 pl-8 pr-3 rounded-full bg-[#0D111A] border border-[#1E293B] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-zinc-700 transition-all font-mono"
          />
        </div>

        {/* Mobile Search Toggle */}
        <button
          type="button"
          onClick={() => setSearchExpanded((p) => !p)}
          className="md:hidden p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Bell with Interactive Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowAlerts((prev) => !prev)}
            aria-label="Notifications"
            title="Notifications & Cost Alerts"
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center relative transition-all",
              showAlerts
                ? "bg-zinc-800 text-white ring-2 ring-blue-500/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#0062E0] rounded-full ring-2 ring-[#07090E] animate-pulse" />
            )}
          </button>

          {/* Alert Dropdown Panel */}
          {showAlerts && (
            <div className="absolute right-0 top-10 mt-1 w-80 sm:w-96 rounded-2xl bg-[#090D16] border border-[#1E293B] shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 overflow-hidden text-left font-sans animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2333] bg-[#0C101A]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                    Sentinel Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0062E0] text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAlerts(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-md"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#161D2B]">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                    <p className="text-xs font-medium text-zinc-300">No active anomalies</p>
                    <p className="text-[11px] text-zinc-500">All cloud & AI spend is within expected baselines.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={alert.href}
                      onClick={() => setShowAlerts(false)}
                      className={cn(
                        "group block p-3.5 hover:bg-white/[0.04] transition-colors relative",
                        alert.unread && "bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Severity icon */}
                        <div className="mt-0.5 flex-shrink-0">
                          {alert.severity === "critical" ? (
                            <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
                              <Flame className="w-3.5 h-3.5" />
                            </div>
                          ) : alert.severity === "high" ? (
                            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                              {alert.title}
                            </h4>
                            <span className="text-[10px] text-zinc-500 whitespace-nowrap font-mono">
                              {alert.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {alert.desc}
                          </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                          type="button"
                          onClick={(e) => dismissAlert(e, alert.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 p-1 rounded transition-opacity"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-[#1A2333] bg-[#0A0D15]/90 text-center">
                <Link
                  href="/anomalies"
                  onClick={() => setShowAlerts(false)}
                  className="text-xs font-medium text-[#38BDF8] hover:text-white flex items-center justify-center gap-1 py-1 transition-colors font-mono"
                >
                  <span>Open Anomaly Sentinel Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <Link
          href="/settings/profile"
          title="Hiten K. (Admin)"
          className="flex items-center gap-2 group cursor-pointer pl-0.5"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 via-slate-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
            HK
          </div>
        </Link>
      </div>
    </header>
  );
}
