"use client";

import * as React from "react";
import { Calendar, ChevronDown, Bell, Search } from "lucide-react";

export interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 h-16 px-6 bg-white/70 backdrop-blur-md border-b border-[#D6E4F5] sticky top-0 z-30 select-none">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-[#0A192F] tracking-tight whitespace-nowrap">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#475569] font-medium mt-0.5 truncate">{subtitle}</p>}
      </div>

      {/* center — search */}
      <div className="w-80 lg:w-96 hidden xl:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FOCUS resources, tags, API keys..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-[#D6E4F5] text-sm text-[#0A192F] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* right */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          type="button"
          className="h-8 px-3 rounded-xl bg-white border border-[#D6E4F5] text-sm font-medium text-[#0f172a] flex items-center gap-1.5 hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5 text-[#5A6E85]" />
          <span>Last 30 Days</span>
          <ChevronDown className="w-3 h-3 text-[#7E93AB]" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="w-8 h-8 rounded-xl bg-white border border-[#D6E4F5] flex items-center justify-center relative hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-sm"
        >
          <Bell className="w-3.5 h-3.5 text-[#5A6E85]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0062E0] rounded-full ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="h-8 pl-1.5 pr-2.5 rounded-xl bg-white border border-[#D6E4F5] flex items-center gap-2 text-sm font-medium text-[#0f172a] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-sm"
        >
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#0052C2] to-[#0070F3] flex items-center justify-center shadow-xs">
            <span className="text-white text-[10px] font-bold">HK</span>
          </div>
          <span className="font-medium">Hiten</span>
          <ChevronDown className="w-3 h-3 text-[#7E93AB]" />
        </button>
      </div>
    </header>
  );
}
