"use client";

import { Avatar, Badge, Button } from "@cirra/ui";
import { Bell, Building2, LogOut, ShieldCheck } from "lucide-react";
import * as React from "react";

export function Topbar() {
  const tenantName = "Acme Corp";
  const userEmail = "admin@acme.internal";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Tenant Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {tenantName}
          </span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 ml-1">
            Production
          </Badge>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        {/* Alerts / Sentinel Status */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Sentinel Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-950" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Avatar fallback="AD" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                {userEmail}
              </span>
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400">Admin</span>
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-red-600 gap-1.5"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
