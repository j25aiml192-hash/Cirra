"use client";

import * as React from "react";
import { Calendar, ChevronDown, Bell } from "lucide-react";

export interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-transparent">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* center — search */}
      <div className="w-96">
        <input
          type="text"
          placeholder="Search spend, services, connections..."
          className="w-full h-10 rounded-full bg-white/80 backdrop-blur border border-black/8 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
        />
      </div>

      {/* right */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-10 px-3 rounded-full bg-white/80 backdrop-blur border border-black/8 text-sm text-slate-600 flex items-center gap-1.5 hover:bg-white transition-colors shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Last 30 Days</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-black/8 flex items-center justify-center relative hover:bg-white transition-colors shadow-sm"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="h-10 px-3 rounded-full bg-white/80 backdrop-blur border border-black/8 flex items-center gap-2 text-sm text-slate-700 hover:bg-white transition-colors shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-[11px] font-semibold">HK</span>
          </div>
          <span className="font-medium">Hiten</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
