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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnomalies } from "@/hooks/useAnomalies";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
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
];

export function Sidebar() {
  const pathname = usePathname();

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

  return (
    <aside className="fixed left-3 top-14 z-40 select-none font-sans w-[182px]">
      {/* Attached Glassmorphic Dock - Translucent, Frosted Glass with Specular Light Rim */}
      <div className="relative w-full rounded-b-[24px] rounded-t-none bg-[#09090b]/80 backdrop-blur-2xl backdrop-saturate-[180%] border-x border-b border-white/[0.12] border-t-0 shadow-[0_24px_50px_rgba(0,0,0,0.7),inset_1px_0_0_0_rgba(255,255,255,0.08),inset_-1px_0_0_0_rgba(255,255,255,0.08),inset_0_-1px_1px_0_rgba(255,255,255,0.12)] p-2 flex flex-col justify-between overflow-hidden">
        {/* Subtle Specular Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none rounded-b-[24px]" />

        {/* Navigation Items (Permanently Expanded, Compact Single-Line Width) */}
        <nav className="space-y-1.5 py-1 relative z-10">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            const hasAnomalies = item.name === "Anomalies" && openCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={cn(
                  "group relative flex items-center h-10 px-2 rounded-xl transition-all duration-150 cursor-pointer overflow-hidden w-full",
                  active
                    ? "bg-white text-black font-semibold shadow-none"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                {/* Icon Container: Glassmorphic Squircle */}
                <div
                  className={cn(
                    "w-[30px] h-[30px] rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-150",
                    active
                      ? "text-black"
                      : "bg-white/[0.04] border border-white/[0.08] text-zinc-300 group-hover:text-white group-hover:border-white/[0.18] group-hover:bg-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  )}
                >
                  <Icon size={16} />
                </div>

                {/* Single-Line Page Title (Never wraps) */}
                <span
                  className={cn(
                    "ml-2.5 text-[13px] tracking-tight whitespace-nowrap truncate font-medium",
                    active ? "text-black font-semibold" : "text-zinc-300 group-hover:text-white"
                  )}
                >
                  {item.name}
                </span>

                {/* Badge for Anomalies */}
                {hasAnomalies && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full shrink-0",
                      active
                        ? "bg-black text-white"
                        : "bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    )}
                  >
                    {openCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
