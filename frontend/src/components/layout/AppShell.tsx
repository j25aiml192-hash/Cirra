"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";

interface SidebarContextType {
  isExpanded: boolean;
  pinned: boolean;
  togglePin: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isExpanded: false,
  pinned: false,
  togglePin: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleToggle = () => setPinned((p) => !p);
    window.addEventListener("cirra:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("cirra:toggle-sidebar", handleToggle);
  }, []);

  const isExpanded = pinned || isHovered;

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        pinned,
        togglePin: () => setPinned((p) => !p),
      }}
    >
      <div className="min-h-screen cirra-bg-canvas text-[#0F1E36]">
        {/* Floating Sidebar elevated on top (z-50) */}
        <Sidebar
          pinned={pinned}
          onToggle={() => setPinned((p) => !p)}
          onHoverChange={setIsHovered}
        />

        {/* Page Content dynamically reacting to sidebar expansion/hover */}
        <div
          className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-screen pt-14"
          style={{ marginLeft: isExpanded ? 260 : 88 }}
        >
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
