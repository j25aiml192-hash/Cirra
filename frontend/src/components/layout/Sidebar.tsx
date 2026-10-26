"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cloud,
  Cpu,
  Sparkles,
  Layers,
  ShieldAlert,
  TrendingDown,
  Settings,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  collapsed?: boolean;
  pinned?: boolean;
  onToggle?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: "warning" | "info";
  matchPrefix?: boolean;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    icon: TrendingDown,
  },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    matchPrefix: true,
  },
];

export function Sidebar({ collapsed, pinned = false, onToggle, onHoverChange }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = React.useState(false);
  const isExpanded = pinned || isHovered || (collapsed === false && pinned);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  const isItemActive = (item: NavItem) => {
    if (item.matchPrefix) {
      return pathname.startsWith("/settings");
    }
    return pathname === item.href;
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "fixed left-3 top-3 bottom-3 z-50 flex flex-col justify-between select-none font-sans rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "bg-white border border-[#E2E8F0] shadow-[0_16px_45px_rgba(15,23,42,0.10),0_0_0_1px_rgba(0,0,0,0.03)]"
      )}
      style={{
        width: isExpanded ? 240 : 72,
      }}
    >
      {/* Top Section: Header + Main Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Block matching the NEXUS style banner */}
        <div
          className={cn(
            "h-14 flex items-center bg-[#D2D9DF] transition-all px-3 flex-shrink-0",
            !isExpanded ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/"
            title="Cirra Home"
            className="flex items-center gap-2.5 group cursor-pointer min-w-0"
          >
            <img
              src="/cirra-logo.png"
              alt="Cirra"
              className="w-8 h-8 rounded-lg object-contain flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
            />
            {isExpanded && (
              <span className="text-[15px] font-black tracking-wider text-[#0B1527] uppercase truncate font-sans">
                CIRRA
              </span>
            )}
          </Link>

          {isExpanded && onToggle && (
            <button
              type="button"
              onClick={onToggle}
              title={pinned ? "Unpin sidebar (hover mode)" : "Pin sidebar"}
              className={cn(
                "p-1.5 rounded-lg transition-colors flex-shrink-0",
                pinned
                  ? "text-[#1A56DB] bg-[#1A56DB]/10 hover:bg-[#1A56DB]/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              )}
            >
              <Pin className={cn("w-3.5 h-3.5 transition-transform", pinned && "rotate-45 fill-current")} />
            </button>
          )}
        </div>

        {/* Fine Dashed Divider under Header */}
        <div className="border-b border-dashed border-[#CBD5E1] mx-3 my-2 flex-shrink-0" />

        {/* Main Nav Items List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 py-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={cn(
                  "group flex items-center transition-all duration-200 rounded-xl",
                  !isExpanded ? "justify-center p-1" : "gap-3 px-2 py-1.5",
                  active
                    ? isExpanded
                      ? "bg-[#F0F5FF]"
                      : ""
                    : "hover:bg-[#F4F7FA]"
                )}
              >
                {/* Squircle Icon Badge */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    active
                      ? "bg-[#0B1527] text-white shadow-sm"
                      : "bg-[#F0F4F8] text-[#0F1E36] group-hover:bg-[#E4EAF0]"
                  )}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                </div>

                {/* Text Label */}
                {isExpanded && (
                  <span
                    className={cn(
                      "text-[14px] truncate transition-colors whitespace-nowrap",
                      active
                        ? "text-[#1A56DB] font-semibold"
                        : "text-[#0F1E36] font-medium group-hover:text-black"
                    )}
                  >
                    {item.name}
                  </span>
                )}

                {/* Badge (e.g. Anomalies count) */}
                {isExpanded && item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full select-none",
                      item.badgeType === "warning"
                        ? "bg-[#FEF3C7] text-[#D97706]"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Dashed Divider + Settings Item */}
      <div className="flex-shrink-0 px-2 pb-3">
        <div className="border-t border-dashed border-[#CBD5E1] mx-1 my-2" />

        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={cn(
                "group flex items-center transition-all duration-200 rounded-xl",
                !isExpanded ? "justify-center p-1" : "gap-3 px-2 py-1.5",
                active
                  ? isExpanded
                    ? "bg-[#F0F5FF]"
                    : ""
                  : "hover:bg-[#F4F7FA]"
              )}
            >
              {/* Squircle Icon Badge */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                  active
                    ? "bg-[#0B1527] text-white shadow-sm"
                    : "bg-[#F0F4F8] text-[#0F1E36] group-hover:bg-[#E4EAF0]"
                )}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
              </div>

              {/* Text Label */}
              {isExpanded && (
                <span
                  className={cn(
                    "text-[14px] truncate transition-colors whitespace-nowrap",
                    active
                      ? "text-[#1A56DB] font-semibold"
                      : "text-[#0F1E36] font-medium group-hover:text-black"
                  )}
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
