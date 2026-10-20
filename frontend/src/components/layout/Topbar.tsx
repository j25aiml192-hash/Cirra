"use client";

import * as React from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      {/* Search / Context bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search resources, services, or ask Cirra..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-1.5 text-xs focus:border-brand-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>RLS Active</span>
        </div>

        <button className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
        </button>

        <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-xs font-semibold text-white">
            JD
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Jane Doe</p>
            <p className="text-[11px] text-zinc-500">Acme Cloud Corp</p>
          </div>
        </div>
      </div>
    </header>
  );
}
