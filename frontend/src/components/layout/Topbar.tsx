"use client";

import * as React from "react";
import {
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./AppShell";

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

const INITIAL_ALERTS: AlertItem[] = [];

export function Topbar({ title, subtitle }: TopbarProps) {
  const pathname = usePathname();
  const { isExpanded } = useSidebar();
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [showAlerts, setShowAlerts] = React.useState(false);
  const [alerts, setAlerts] = React.useState<AlertItem[]>(INITIAL_ALERTS);

  const getNavbarTitle = () => {
    // Keep "Welcome back, Hiten" on dashboard and ask cirra (as requested)
    if (!pathname || pathname === "/dashboard" || pathname === "/" || pathname === "/ask") {
      return "Welcome back, Hiten";
    }

    // Dynamic title for each page based on active route
    if (pathname === "/anomalies") return "Anomalies";
    if (pathname === "/spend/cloud") return "Cloud Spend";
    if (pathname === "/spend/ai") return "AI Models";
    if (pathname === "/allocation") return "Allocation";
    if (pathname === "/savings") return "Savings";
    if (pathname.startsWith("/settings")) return "Settings";

    if (title) return title;

    const segment = pathname.split("/").filter(Boolean).pop();
    return segment
      ? segment
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ")
      : "Welcome back, Hiten";
  };

  const displayTitle = getNavbarTitle();

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => a.unread).length;

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
    <header
      className="fixed top-0 left-0 right-0 h-14 bg-[#07090E] border-b border-[#1A2333] z-30 select-none text-white shadow-sm flex items-center justify-between pr-4 sm:pr-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        paddingLeft: isExpanded ? 272 : 96,
      }}
    >
      {/* Left: Greeting Title / Page Title */}
      <div className="flex items-center min-w-0">
        <div className="flex items-center gap-2 truncate">
          <h1 className="text-[14px] sm:text-[15px] font-semibold text-white tracking-tight truncate">
            {displayTitle}
          </h1>
          {subtitle && pathname !== "/dashboard" && pathname !== "/" && pathname !== "/ask" && (
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
