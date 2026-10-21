"use client";

import * as React from "react";
import { Calendar, ChevronDown, Bell, Search } from "lucide-react";
import Link from "next/link";
import { TopNavPills } from "./TopNavPills";

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  showNavPills?: boolean;
}

export function Topbar({ title, subtitle, showNavPills = true }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-3 h-14 px-6 bg-white/80 backdrop-blur-md border-b border-[#D6E4F5] sticky top-0 z-30 select-none">
      {/* Left: TopNavPills or Title */}
      {showNavPills ? (
        <div className="flex-shrink-0">
          <TopNavPills />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-[#0A192F] tracking-tight whitespace-nowrap">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-[#475569] font-medium mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden md:block w-44 lg:w-56">
          <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FOCUS resources..."
            className="w-full h-8 pl-8 pr-3 rounded-full bg-white border border-[#D6E4F5] text-xs text-[#0A192F] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs"
          />
        </div>

        {/* Date / Calendar button */}
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-white border border-[#D6E4F5] text-xs font-semibold text-[#0A192F] flex items-center gap-1.5 hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-xs"
        >
          <Calendar className="w-3.5 h-3.5 text-[#5A6E85]" />
          <span>Last 30 Days</span>
          <ChevronDown className="w-3 h-3 text-[#7E93AB]" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-8 h-8 rounded-full bg-white border border-[#D6E4F5] flex items-center justify-center relative hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-xs"
        >
          <Bell className="w-3.5 h-3.5 text-[#5A6E85]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0062E0] rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <Link
          href="/settings/profile"
          className="h-8 pl-1.5 pr-2.5 rounded-full bg-white border border-[#D6E4F5] flex items-center gap-1.5 text-xs font-semibold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-xs"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0052C2] to-[#0070F3] flex items-center justify-center shadow-xs">
            <span className="text-white text-[9px] font-bold">HK</span>
          </div>
          <span>Hiten</span>
          <ChevronDown className="w-3 h-3 text-[#7E93AB]" />
        </Link>
      </div>
    </header>
  );
}
