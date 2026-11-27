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
  ChevronRight,
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
  const [isHovered, setIsHovered] = React.useState(false);

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
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-3.5 top-14 z-40 select-none font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isHovered ? "w-60" : "w-[62px]"
      )}
    >
      {/* Attached Glassmorphic Dock - Translucent, Frosted Glass with Specular Light Rim */}
      <div className="relative w-full rounded-b-[26px] rounded-t-none bg-[#09090b]/55 backdrop-blur-2xl backdrop-saturate-[180%] border-x border-b border-white/[0.12] border-t-0 shadow-[0_24px_50px_rgba(0,0,0,0.7),inset_1px_0_0_0_rgba(255,255,255,0.08),inset_-1px_0_0_0_rgba(255,255,255,0.08),inset_0_-1px_1px_0_rgba(255,255,255,0.12)] p-2 flex flex-col justify-between overflow-hidden">
        {/* Subtle Specular Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none rounded-b-[26px]" />

        {/* Navigation Items (Golden Ratio Centering, Aligned Directly Beneath Navbar Logo) */}
        <nav className="space-y-1.5 py-1.5 relative z-10">
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
                  "group relative flex items-center h-11 transition-all duration-200 cursor-pointer overflow-hidden w-full",
                  active
                    ? isHovered
                      ? "bg-white text-black font-bold rounded-2xl px-2.5 shadow-none"
                      : "bg-white text-black font-bold rounded-2xl justify-center shadow-none"
                    : isHovered
                    ? "text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-2xl px-2.5"
                    : "text-zinc-400 hover:text-white rounded-2xl justify-center"
                )}
              >
                {/* Icon Container: Glassmorphic Squircle (Centered via Golden Ratio) */}
                <div
                  className={cn(
                    "w-[38px] h-[38px] rounded-[13px] flex items-center justify-center shrink-0 transition-all duration-200",
                    active
                      ? isHovered
                        ? "text-black"
                        : "text-black"
                      : isHovered
                      ? "bg-white/[0.05] border border-white/[0.08] text-zinc-300 group-hover:text-white group-hover:border-white/[0.18] group-hover:bg-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      : "bg-white/[0.04] border border-white/[0.07] text-zinc-400 group-hover:text-white group-hover:border-white/[0.18] group-hover:bg-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  )}
                >
                  <Icon size={19} />
                </div>

                {/* Expanded Label Text (hidden when collapsed so margin never pushes icon off-center) */}
                {isHovered && (
                  <span
                    className={cn(
                      "ml-3 text-[13.5px] font-medium tracking-tight whitespace-nowrap transition-all duration-200 truncate",
                      active ? "text-black font-semibold" : "text-zinc-200 group-hover:text-white"
                    )}
                  >
                    {item.name}
                  </span>
                )}

                {/* Badge for Anomalies when expanded */}
                {hasAnomalies && isHovered && (
                  <span className="ml-auto text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    {openCount}
                  </span>
                )}

                {/* Badge dot when collapsed */}
                {hasAnomalies && !isHovered && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black/40 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
