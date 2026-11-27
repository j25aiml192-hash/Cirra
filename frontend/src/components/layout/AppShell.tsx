"use client";

import React, { useEffect, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { AiChatWidget } from "@/components/ui/AiChatWidget";

interface SidebarContextType {
  isExpanded: boolean;
  pinned: boolean;
  togglePin: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isExpanded: true,
  pinned: true,
  togglePin: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("cirra-bg-canvas");
    document.body.style.backgroundColor = "#000000";
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: true,
        pinned: true,
        togglePin: () => {},
      }}
    >
      <div className="min-h-screen bg-black text-white selection:bg-zinc-200 selection:text-black font-sans app-typography relative">
        {/* Subtle Off-White Ambient Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 right-0 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03),transparent_70%)] z-0"
        />

        {/* Floating Capsule Dock Left Sidebar */}
        <Sidebar />

        {/* Page Content docked to right of floating sidebar rail */}
        <div className="pl-[82px] min-h-screen bg-black pt-14 relative z-10 transition-all duration-300">
          {children}
        </div>

        <AiChatWidget />
      </div>
    </SidebarContext.Provider>
  );
}
