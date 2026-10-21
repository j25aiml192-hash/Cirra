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

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center h-9 px-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none",
        isActive
          ? "bg-[#EBF3FE] text-[#0062E0] font-semibold border border-[#BCD9FC]/70 shadow-[0_1px_3px_rgba(0,98,224,0.06)]"
          : "text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F2F7FD]"
      )}
      style={{
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <div className={cn(
        "relative flex items-center justify-center w-4 h-4 flex-shrink-0 transition-colors",
        isActive ? "text-[#0062E0]" : "text-[#5A6E85] group-hover:text-[#0A192F]"
      )}>
        {icon}
        {badge && collapsed && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EA3943] ring-2 ring-white"
          />
        )}
      </div>

      {!collapsed && (
        <div className="flex flex-1 items-center justify-between ml-2.5 overflow-hidden">
          <span className="truncate">{label}</span>
          {badge && (
            <span
              className={cn(
                "ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                badgeColor === "amber"
                  ? "bg-[#FFF4E5] text-[#B45309] border border-[#FDE68A]"
                  : badgeColor === "rose"
                  ? "bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]"
                  : "bg-[#EBF3FE] text-[#0062E0] border border-[#BCD9FC]"
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
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between cirra-sidebar transition-all duration-200 select-none"
      style={{
        width: collapsed ? 76 : 240,
      }}
    >
      {/* Top: Logo & Nav items */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-4">
        {/* Brand header */}
        <div
          className={cn(
            "flex items-center pb-3.5 mb-3 border-b border-[#D6E4F5]",
            collapsed ? "justify-center" : "justify-between px-1"
          )}
        >
          <Link
            href="/"
            title="Cirra — Cloud & AI Cost Intelligence"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0052C2] to-[#0070F3] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#0062E0]/25 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-sm tracking-tight">C</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[#0A192F] text-[15px] tracking-tight leading-tight">
                  Cirra
                </span>
                <span className="text-[10px] text-[#5A6E85] font-medium tracking-normal">
                  Cost Intelligence
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className="text-[#5A6E85] hover:text-[#0A192F] p-1 rounded-lg hover:bg-[#EBF3FE] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Section: Overview */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2.5 py-1">
              Overview
            </div>
          )}
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
            collapsed={collapsed}
          />

          {!collapsed && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2.5 py-1 mt-3">
              Spend
            </div>
          )}
          <NavItem
            href="/spend/cloud"
            icon={<Cloud className="w-4 h-4" />}
            label="Cloud Spend"
            collapsed={collapsed}
          />
          <NavItem
            href="/spend/ai"
            icon={<Cpu className="w-4 h-4" />}
            label="AI Models"
            collapsed={collapsed}
          />

          {!collapsed && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2.5 py-1 mt-3">
              Optimize
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

      {/* Bottom: Settings & User Profile */}
      <div className="p-3 border-t border-[#D6E4F5] space-y-1 bg-white/60">
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
            "flex items-center pt-2 mt-1 border-t border-[#D6E4F5]",
            collapsed ? "justify-center" : "gap-2.5 px-2 py-1.5 rounded-xl bg-[#F0F5FD] border border-[#D6E4F5]"
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-[#DCEBFC] text-[#0062E0] flex items-center justify-center text-[11px] font-bold flex-shrink-0 border border-[#BCD9FC]">
            HK
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-[#0A192F] truncate leading-tight">
                Hiten K.
              </span>
              <span className="text-[10px] text-[#5A6E85] truncate leading-tight">
                Acme Inc. (Admin)
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
