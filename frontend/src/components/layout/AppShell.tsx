"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => setCollapsed((c) => !c);
    window.addEventListener("cirra:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("cirra:toggle-sidebar", handleToggle);
  }, []);

  return (
    <div className="min-h-screen cirra-bg-canvas text-[#0F1E36]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div
        className="transition-all duration-200 min-h-screen"
        style={{ marginLeft: collapsed ? 68 : 210 }}
      >
        {children}
      </div>
    </div>
  );
}
