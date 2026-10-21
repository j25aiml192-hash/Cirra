"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

const defaultNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/spend/cloud", label: "Cloud Spend" },
  { href: "/spend/ai", label: "AI Models" },
  { href: "/allocation", label: "Attribution" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/savings", label: "Savings" },
];

export function TopNavPills({ items = defaultNavItems }: { items?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main Navigation"
      className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[#E5EBF2] border border-[#D5E0EB] shadow-inner max-w-full select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 sm:px-4 lg:px-4.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
              isActive
                ? "bg-[#181B20] text-white font-semibold shadow-xs"
                : "text-[#4A5E73] font-medium hover:text-[#0A192F] hover:bg-white/40"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
