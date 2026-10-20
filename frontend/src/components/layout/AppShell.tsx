"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AiChatWidget } from "@/components/ui/AiChatWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div
        className="transition-all duration-200"
        style={{ marginLeft: collapsed ? 84 : 256 }}
      >
        {children}
      </div>
      <AiChatWidget />
    </div>
  );
}
