"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AiChatWidget } from "@/components/ui/AiChatWidget";

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
  const pathname = usePathname();
  const isAskPage = pathname === "/ask" || pathname?.startsWith("/ask");

  useEffect(() => {
    const handleToggle = () => setPinned((p) => !p);
    window.addEventListener("cirra:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("cirra:toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    if (isAskPage) {
      document.body.classList.remove("cirra-bg-canvas");
      document.body.style.backgroundColor = "#CFE7FD";
    } else {
      document.body.classList.add("cirra-bg-canvas");
      document.body.style.backgroundColor = "";
    }
  }, [isAskPage]);

  const isExpanded = pinned || isHovered;

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        pinned,
        togglePin: () => setPinned((p) => !p),
      }}
    >
      <div
        className={`min-h-screen ${
          isAskPage
            ? "bg-gradient-to-b from-[#BEE0FD] via-[#D5ECFE] via-30% via-[#E5F3FE] via-65% via-[#F0F8FF] to-[#FAFDFE] text-[#0A192F]"
            : "text-[#0F1E36]"
        }`}
      >
        {/* Floating Sidebar elevated on top (z-50) */}
        <Sidebar
          pinned={pinned}
          onToggle={() => setPinned((p) => !p)}
          onHoverChange={setIsHovered}
        />

        {/* Page Content dynamically reacting to sidebar expansion/hover */}
        <div
          className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-screen ${
            isAskPage ? "pt-4 sm:pt-6" : "pt-14"
          }`}
          style={{ marginLeft: isExpanded ? 260 : 88 }}
        >
          {children}
        </div>

        <AiChatWidget />
      </div>
    </SidebarContext.Provider>
  );
}
