"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Cloud,
  Cpu,
  Sparkles,
  Layers,
  ShieldAlert,
  Wallet,
  Zap,
  PhoneCall,
  Settings,
  Search,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnomalies } from "@/hooks/useAnomalies";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  badge?: string;
  hasChevron?: boolean;
  matchPrefix?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    name: "Cloud Spend",
    href: "/spend/cloud",
    icon: Cloud,
  },
  {
    name: "AI Models",
    href: "/spend/ai",
    icon: Cpu,
  },
  {
    name: "Ask Cirra",
    href: "/ask",
    icon: Sparkles,
  },
  {
    name: "Allocation",
    href: "/allocation",
    icon: Layers,
  },
  {
    name: "Anomalies",
    href: "/anomalies",
    icon: ShieldAlert,
  },
  {
    name: "Savings",
    href: "/savings",
    icon: Wallet,
  },
  {
    name: "Actions",
    href: "/actions",
    icon: Zap,
  },
  {
    name: "Voice Calls",
    href: "/calls",
    icon: PhoneCall,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    matchPrefix: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [filterQuery, setFilterQuery] = React.useState("");

  const { data: anomalies } = useAnomalies("open");
  const openCount = Array.isArray(anomalies) ? anomalies.length : 0;

  const isItemActive = (item: NavItem) => {
    if (item.matchPrefix) {
      return pathname.startsWith("/settings");
    }
    if (item.href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname === item.href;
  };

  const visibleItems = React.useMemo(() => {
    if (!filterQuery.trim()) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter((i) =>
      i.name.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [filterQuery]);

  return (
    <aside className="w-64 fixed left-0 top-0 bottom-0 h-screen bg-black border-r border-zinc-800/80 flex flex-col justify-between p-3 z-40 select-none overflow-y-auto font-sans scrollbar-none">
      {/* Top Stack: Cirra Logo Brand + Find Search + Navigation Items */}
      <div className="space-y-3.5">
        {/* Cirra Logo & Brand Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-zinc-900/50 transition-colors group"
        >
          <img
            src="/cirra-logo.png"
            alt="Cirra Logo"
            className="w-7 h-7 rounded-lg object-contain shadow-[0_0_10px_rgba(5,150,105,0.3)]"
          />
          <span className="text-xl font-bold tracking-tight text-white font-sans group-hover:text-emerald-400 transition-colors">
            cirra
          </span>
        </Link>

        {/* Vercel 'Find [F]' search input */}
        <div className="relative px-0.5">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Find"
            className="w-full h-9 pl-9 pr-7 text-xs sm:text-sm font-mono bg-zinc-900/80 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600/60 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 px-1 py-0.2 rounded bg-zinc-800 border border-zinc-700/60 pointer-events-none">
            F
          </kbd>
        </div>

        {/* Navigation List - Larger, comfortable editorial typography */}
        <nav className="space-y-1 pt-1">
          {visibleItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            const badgeValue =
              item.name === "Anomalies" && openCount > 0
                ? String(openCount)
                : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all group",
                  active
                    ? "bg-zinc-900 text-white font-semibold border-l-[3px] border-emerald-600 pl-3 shadow-[0_0_15px_rgba(5,150,105,0.2)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span className="truncate text-[15px] font-medium tracking-tight">
                    {item.name}
                  </span>
                </div>

                {badgeValue && (
                  <span
                    className={cn(
                      "ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                      item.name === "Anomalies"
                        ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 shadow-[0_0_8px_rgba(5,150,105,0.4)]"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    )}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Stack: User Profile Pill */}
      <div className="pt-3 border-t border-zinc-800/80">
        {/* User Profile Pill: Avatar + Name + ... + Bell */}
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 transition-colors group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-emerald-600/50 flex-shrink-0 shadow-[0_0_8px_rgba(5,150,105,0.25)] bg-zinc-800">
              <img
                src="/profile-avatar.jpg"
                alt="hiten kumar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white">
              hiten kumar
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <Link
              href="/settings"
              className="p-1 hover:text-white rounded transition-colors"
              title="Organization Settings"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Link>
            <Link
              href="/anomalies"
              className="p-1 hover:text-white rounded transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {openCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] absolute top-0.5 right-0.5" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}