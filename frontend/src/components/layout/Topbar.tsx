"use client";

import * as React from "react";
import {
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAnomalies } from "@/hooks/useAnomalies";

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
  const [showAlerts, setShowAlerts] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [alerts, setAlerts] = React.useState<AlertItem[]>(INITIAL_ALERTS);

  const { data: anomaliesData } = useAnomalies("open");

  React.useEffect(() => {
    if (Array.isArray(anomaliesData) && anomaliesData.length > 0) {
      setAlerts(
        anomaliesData.map((a: any) => ({
          id: a.id || String(Math.random()),
          title: a.service ? `${a.service} Anomaly` : (a.title || "Cost Anomaly Detected"),
          desc:
            a.root_cause ||
            a.description ||
            `Unexpected spend spike of $${Number(a.anomaly_cost || a.cost || 0).toLocaleString()}`,
          time: "Recent",
          severity: a.severity === "critical" ? "critical" : a.severity === "high" ? "high" : "medium",
          unread: true,
          href: `/anomalies`,
        }))
      );
    }
  }, [anomaliesData]);

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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getDisplayTitle = () => {
    if (!pathname || pathname === "/dashboard" || pathname === "/" || pathname === "/ask") {
      return "Welcome back, Hiten";
    }
    if (pathname === "/spend/cloud") return "Cloud Spend";
    if (pathname === "/spend/ai") return "AI Models";
    if (pathname === "/allocation") return "Allocation";
    if (pathname === "/anomalies") return "Anomalies";
    if (pathname === "/savings") return "Savings";
    if (pathname === "/actions") return "Actions";
    if (pathname === "/calls") return "Voice Calls";
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

  const displayTitle = getDisplayTitle();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-black border-b border-zinc-800/80 z-30 select-none text-white flex items-center justify-between px-6 transition-all font-sans">
      {/* Left: Universal Greeting or Page Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-sm font-semibold text-white tracking-tight truncate">
          {displayTitle}
        </h1>
        {subtitle && pathname !== "/dashboard" && pathname !== "/" && pathname !== "/ask" && (
          <span className="hidden xl:inline-block text-xs text-zinc-500 font-normal truncate">
            · {subtitle}
          </span>
        )}
      </div>

      {/* Right: Search resources... input + Bell icon + User Avatar (HK) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search resources... pill */}
        <div className="relative w-44 sm:w-60">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full h-8 pl-8 pr-3 rounded-full bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-sans"
          />
        </div>

        {/* Notifications Bell with Interactive Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowAlerts((p) => !p)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-10 mt-1 w-80 sm:w-96 rounded-2xl bg-[#09090b] border border-zinc-800 shadow-2xl z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Sentinel Detections
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {unreadCount} open alerts
                </span>
              </div>

              <div className="divide-y divide-zinc-800/80 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-sans">
                    All cloud telemetry nominal. No active anomalies.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href="/anomalies"
                      onClick={() => setShowAlerts(false)}
                      className="p-3.5 hover:bg-zinc-900/60 transition-colors flex items-start gap-3 block"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                      <div className="space-y-0.5 truncate flex-1">
                        <div className="text-xs font-semibold text-white truncate">
                          {alert.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {alert.desc}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-zinc-800 bg-zinc-950 text-center">
                <Link
                  href="/anomalies"
                  onClick={() => setShowAlerts(false)}
                  className="text-xs font-mono text-zinc-200 hover:text-white font-semibold"
                >
                  View Sentinel Hub →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar (Hiten Kumar) */}
        <Link
          href="/settings"
          title="Account Settings"
          className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-colors shadow-[0_0_8px_rgba(255,255,255,0.1)] bg-zinc-800"
        >
          <img
            src="/profile-avatar.jpg"
            alt="hiten kumar"
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}