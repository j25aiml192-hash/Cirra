"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cloud,
  Cpu,
  MessageSquareCode,
  PieChart,
  Settings,
  Users,
  PlugZap,
  ChevronDown,
  Layers,
} from "lucide-react";
import { cn } from "@cirra/ui";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{ title: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Spend Analysis",
    href: "/spend/cloud",
    icon: Layers,
    children: [
      {
        title: "Cloud Spend",
        href: "/spend/cloud",
        icon: Cloud,
      },
      {
        title: "AI & LLM Cost",
        href: "/spend/ai",
        icon: Cpu,
      },
    ],
  },
  {
    title: "Ask Cirra",
    href: "/ask",
    icon: MessageSquareCode,
  },
  {
    title: "Allocation",
    href: "/allocation",
    icon: PieChart,
  },
  {
    title: "Settings",
    href: "/settings/connections",
    icon: Settings,
    children: [
      {
        title: "Connections",
        href: "/settings/connections",
        icon: PlugZap,
      },
      {
        title: "Team & RBAC",
        href: "/settings/team",
        icon: Users,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25">
          C
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            Cirra
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400">
            Control Plane
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.children && item.children.some((child) => pathname === child.href));

          if (item.children) {
            return (
              <div key={item.title} className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>{item.title}</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
                <div className="pl-2 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isChildActive
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                      >
                        <ChildIcon
                          className={cn(
                            "h-4 w-4",
                            isChildActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span>{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <ItemIcon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span>FOCUS 1.0 Aligned</span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
}
