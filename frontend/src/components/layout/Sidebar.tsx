"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cloud,
  Cpu,
  Sparkles,
  GitBranch,
  AlertTriangle,
  TrendingDown,
  Plug,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: "amber" | "rose" | "indigo";
  collapsed: boolean;
}

function NavItem({ href, icon, label, badge, badgeColor = "amber", collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const badgeBg =
    badgeColor === "amber" ? "bg-amber-100 text-amber-800" :
    badgeColor === "rose" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800";

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center h-10 px-2.5 rounded-[10px] transition-colors group",
        isActive
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
      style={{
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
        {icon}
        {badge && collapsed && (
          <span
            className={cn(
              "absolute -top-1 -right-1 w-2 h-2 rounded-full",
              badgeColor === "amber" ? "bg-amber-500" : "bg-rose-500"
            )}
          />
        )}
      </div>

      {!collapsed && (
        <div className="flex flex-1 items-center justify-between ml-2.5 overflow-hidden">
          <span className="text-sm truncate">{label}</span>
          {badge && (
            <span
              className={cn(
                "ml-auto text-[11px] font-semibold px-1.5 py-0.2 rounded-full",
                badgeBg
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <nav
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-200 flex flex-col justify-between"
      style={{
        width: collapsed ? 68 : 240,
        height: "calc(100vh - 32px)",
        maxHeight: 740,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        borderRadius: 20,
        padding: "16px 10px",
      }}
    >
      {/* Top: Logo + Toggle */}
      <div>
        <div
          className={cn(
            "flex items-center pb-3 border-b border-black/5",
            collapsed ? "justify-center" : "justify-between px-2"
          )}
        >
          <Link
            href="/"
            title="Go to Cirra landing page"
            className="flex items-center gap-2.5 group cursor-pointer hover:opacity-85 transition-all"
          >
            <img
              src="/cirra-logo.png"
              alt="Cirra"
              className="w-9 h-9 rounded-[10px] object-cover flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                  Cirra
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Cost Control</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100/50 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="mt-3 space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 py-1">
              OVERVIEW
            </div>
          )}
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
            collapsed={collapsed}
          />

          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 py-1 mt-2.5">
              SPEND
            </div>
          )}
          <NavItem
            href="/spend/cloud"
            icon={<Cloud className="w-4 h-4" />}
            label="Cloud"
            collapsed={collapsed}
          />
          <NavItem
            href="/spend/ai"
            icon={<Cpu className="w-4 h-4" />}
            label="AI Models"
            collapsed={collapsed}
          />

          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 py-1 mt-2.5">
              OPTIMIZE
            </div>
          )}
          <NavItem
            href="/ask"
            icon={<Sparkles className="w-4 h-4" />}
            label="Ask Cirra"
            collapsed={collapsed}
          />
          <NavItem
            href="/allocation"
            icon={<GitBranch className="w-4 h-4" />}
            label="Allocation"
            collapsed={collapsed}
          />
          <NavItem
            href="/anomalies"
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Anomalies"
            badge="3"
            badgeColor="amber"
            collapsed={collapsed}
          />
          <NavItem
            href="/savings"
            icon={<TrendingDown className="w-4 h-4" />}
            label="Savings"
            collapsed={collapsed}
          />
        </div>
      </div>

      {/* Bottom: Settings & Avatar */}
      <div className="pt-2 border-t border-black/5 space-y-1">
        <NavItem
          href="/settings/connections"
          icon={<Plug className="w-4 h-4" />}
          label="Connections"
          collapsed={collapsed}
        />
        <NavItem
          href="/settings/team"
          icon={<Users className="w-4 h-4" />}
          label="Team"
          collapsed={collapsed}
        />
        <NavItem
          href="/settings/profile"
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          collapsed={collapsed}
        />

        <div
          className={cn(
            "flex items-center pt-2 px-1 mt-1",
            collapsed ? "justify-center" : "gap-2.5 px-2"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
            HK
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-800 truncate">Hiten K.</span>
              <span className="text-[10px] text-slate-400 truncate">Acme Inc. (Admin)</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
