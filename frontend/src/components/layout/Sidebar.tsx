"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cloud,
  Bot,
  MessageSquare,
  PieChart,
  AlertTriangle,
  PiggyBank,
  PlugZap,
  Users,
  User,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Spend Intelligence",
    children: [
      { name: "Cloud Spend", href: "/spend/cloud", icon: Cloud },
      { name: "AI & LLM Spend", href: "/spend/ai", icon: Bot },
    ],
  },
  { name: "Ask Cirra", href: "/ask", icon: MessageSquare },
  { name: "Unit Economics", href: "/allocation", icon: PieChart },
  { name: "Anomalies", href: "/anomalies", icon: AlertTriangle, badge: "3" },
  { name: "Guaranteed Savings", href: "/savings", icon: PiggyBank },
];

const settingsNav = [
  { name: "Connections", href: "/settings/connections", icon: PlugZap },
  { name: "Team & RBAC", href: "/settings/team", icon: Users },
  { name: "Profile", href: "/settings/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">Cirra</span>
          <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            PRO
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              return (
                <div key={item.name} className="pt-3">
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {item.name}
                  </div>
                  <div className="space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;
                      const Icon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
                              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-6">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Settings
          </div>
          <div className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
