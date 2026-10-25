"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutDashboard,
  Cloud,
  Cpu,
  Sparkles,
  Layers,
  ShieldAlert,
  TrendingDown,
  Plug,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavFile {
  name: string;
  href: string;
  badge?: string;
  badgeType?: "warning" | "info" | "success";
  icon?: React.ReactNode;
}

interface NavSection {
  id: string;
  name: string;
  files: NavFile[];
}

const SECTIONS: NavSection[] = [
  {
    id: "overview",
    name: "overview",
    files: [
      {
        name: "dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    id: "spend",
    name: "spend",
    files: [
      {
        name: "cloud-spend",
        href: "/spend/cloud",
        icon: <Cloud className="w-3.5 h-3.5" />,
      },
      {
        name: "ai-models",
        href: "/spend/ai",
        icon: <Cpu className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    id: "ask",
    name: "ask-cirra",
    files: [
      {
        name: "chat",
        href: "/ask",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    id: "optimize",
    name: "optimize",
    files: [
      {
        name: "allocation",
        href: "/allocation",
        icon: <Layers className="w-3.5 h-3.5" />,
      },
      {
        name: "anomalies",
        href: "/anomalies",
        badge: "3",
        badgeType: "warning",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      },
      {
        name: "savings",
        href: "/savings",
        icon: <TrendingDown className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    id: "settings",
    name: "settings",
    files: [
      {
        name: "connections",
        href: "/settings/connections",
        icon: <Plug className="w-3.5 h-3.5" />,
      },
      {
        name: "team",
        href: "/settings/team",
        icon: <Users className="w-3.5 h-3.5" />,
      },
      {
        name: "profile",
        href: "/settings/profile",
        icon: <Settings className="w-3.5 h-3.5" />,
      },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({
    overview: true,
    spend: true,
    ask: true,
    optimize: true,
    settings: true,
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);

  // Restore saved theme preference and folder state if explicitly saved, otherwise default to dark theme & all open
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("cirra_sidebar_theme");
      if (saved === "light") {
        setIsDarkTheme(false);
      } else if (saved === "dark") {
        setIsDarkTheme(true);
      }
      const savedFolders = localStorage.getItem("cirra_sidebar_open_folders");
      if (savedFolders) {
        setOpenFolders(JSON.parse(savedFolders));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cirra_sidebar_theme", next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => {
      const updated = {
        ...prev,
        [folderId]: !prev[folderId],
      };
      try {
        localStorage.setItem("cirra_sidebar_open_folders", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const expandAll = () => {
    const allOpen = {
      overview: true,
      spend: true,
      ask: true,
      optimize: true,
      settings: true,
    };
    setOpenFolders(allOpen);
    try {
      localStorage.setItem("cirra_sidebar_open_folders", JSON.stringify(allOpen));
    } catch {
      // ignore
    }
  };

  const collapseAll = () => {
    const allClosed = {
      overview: false,
      spend: false,
      ask: false,
      optimize: false,
      settings: false,
    };
    setOpenFolders(allClosed);
    try {
      localStorage.setItem("cirra_sidebar_open_folders", JSON.stringify(allClosed));
    } catch {
      // ignore
    }
  };

  const isAllOpen = SECTIONS.every((s) => Boolean(openFolders[s.id]));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between transition-all duration-200 select-none font-mono text-[13px] leading-relaxed",
        isDarkTheme
          ? "bg-[#07090E] text-[#D8E2EE] border-r border-[#1A2333] shadow-[4px_0_30px_rgba(0,0,0,0.4)]"
          : "bg-[#F8FAFC] text-[#0F172A] border-r border-[#CBD5E1] shadow-[2px_0_20px_rgba(0,0,0,0.06)]"
      )}
      style={{
        width: collapsed ? 68 : 210,
      }}
    >
      {/* Top Header - Cirra Brand Bar (Always dark to match topbar seamlessly) */}
      <div
        className={cn(
          "h-14 flex items-center bg-[#07090E] border-b border-[#1A2333] transition-all flex-shrink-0",
          collapsed ? "justify-center px-2" : "px-3.5"
        )}
      >
        <Link
          href="/"
          title="Cirra — Back to Landing Page"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <img
            src="/cirra-logo.png"
            alt="Cirra"
            className={cn(
              "rounded-lg object-contain flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm",
              collapsed ? "w-8 h-8" : "w-7 h-7"
            )}
          />
          {!collapsed && (
            <span className="text-[17px] font-bold tracking-tight text-white group-hover:text-[#38BDF8] transition-colors font-mono">
              Cirra
            </span>
          )}
        </Link>
      </div>

        {/* Controls Toolbar (when expanded) */}
        {!collapsed && (
          <div
            className={cn(
              "flex items-center justify-between px-3 py-1.5 text-[11px] border-t",
              isDarkTheme
                ? "border-[#141B29] text-zinc-400 bg-[#080B12]"
                : "border-[#EDF2F7] text-slate-500 bg-[#F1F5F9]"
            )}
          >
            <div className="flex items-center gap-1 text-[11px]">
              <span className={cn("font-semibold", isDarkTheme ? "text-[#38BDF8]" : "text-[#0062E0]")}>
                git:(
              </span>
              <span className={cn("font-bold tracking-tight", isDarkTheme ? "text-zinc-100" : "text-slate-900")}>
                main
              </span>
              <span className={cn("font-semibold", isDarkTheme ? "text-[#38BDF8]" : "text-[#0062E0]")}>
                )
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={isAllOpen ? collapseAll : expandAll}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] transition-colors border",
                  isDarkTheme
                    ? "text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800/70"
                    : "text-slate-500 border-slate-300 hover:text-slate-900 hover:bg-slate-200"
                )}
                title={isAllOpen ? "Collapse All" : "Expand All"}
              >
                {isAllOpen ? "− all" : "+ all"}
              </button>

              <button
                type="button"
                onClick={handleToggleTheme}
                className={cn(
                  "p-0.5 rounded text-[10px] transition-colors",
                  isDarkTheme
                    ? "text-zinc-400 hover:text-amber-300"
                    : "text-slate-500 hover:text-indigo-600"
                )}
                title={isDarkTheme ? "Switch to Light Tree" : "Switch to Dark Tree"}
              >
                {isDarkTheme ? "☼" : "☾"}
              </button>
            </div>
          </div>
        )}

        {/* Quick Search in Tree */}
        {!collapsed && (
          <div className="px-2.5 py-1.5">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-all",
                isDarkTheme
                  ? "bg-[#06080E] border-[#1E293B] focus-within:border-[#38BDF8]/60 focus-within:ring-1 focus-within:ring-[#38BDF8]/30"
                  : "bg-white border-[#CBD5E1] focus-within:border-[#0284C7]/60 focus-within:ring-1 focus-within:ring-[#0284C7]/20"
              )}
            >
              <Search className="w-3 h-3 text-zinc-500 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="filter tree..."
                className={cn(
                  "w-full bg-transparent outline-none text-[11px] font-mono",
                  isDarkTheme
                    ? "text-zinc-200 placeholder:text-zinc-500"
                    : "text-slate-900 placeholder:text-slate-400"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

      {/* Main Directory Tree Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 select-none">
        {collapsed ? (
          /* Collapsed Icon/Rail View with Dark Active Highlights */
          <div className="flex flex-col items-center space-y-3 pt-2">
            <Link
              href="/dashboard"
              title="Dashboard (/dashboard)"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                pathname === "/dashboard"
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>

            <Link
              href="/spend/cloud"
              title="Cloud Spend (/spend/cloud)"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                pathname === "/spend/cloud"
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Cloud className="w-4 h-4" />
            </Link>

            <Link
              href="/spend/ai"
              title="AI Models (/spend/ai)"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                pathname === "/spend/ai"
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Cpu className="w-4 h-4" />
            </Link>

            <Link
              href="/ask"
              title="Ask Cirra (/ask)"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                pathname === "/ask"
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </Link>

            <Link
              href="/anomalies"
              title="Anomalies (3 alerts)"
              className={cn(
                "relative w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                pathname === "/anomalies"
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#07090E]" />
            </Link>

            <Link
              href="/settings/connections"
              title="Settings"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all mt-4",
                pathname.startsWith("/settings")
                  ? isDarkTheme
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "bg-[#0A192F] text-white border border-[#0A192F] shadow-sm"
                  : isDarkTheme
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Real Cirra Directory Tree Navigation without .tsx */
          <div className="space-y-3 font-mono text-[13px] leading-[1.8] whitespace-pre select-none tracking-normal">
            {SECTIONS.map((section) => {
              const isOpen = Boolean(openFolders[section.id]);

              return (
                <div key={section.id}>
                  {/* Folder Header: ▼ section_name */}
                  <div
                    onClick={() => toggleFolder(section.id)}
                    className={cn(
                      "flex items-center gap-1.5 cursor-pointer py-0.5 px-1.5 rounded transition-colors group",
                      isDarkTheme ? "hover:bg-white/[0.05]" : "hover:bg-slate-200/50"
                    )}
                  >
                    <span className={cn("text-xs font-bold", isDarkTheme ? "text-zinc-400" : "text-slate-700")}>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span
                      className={cn(
                        "font-bold uppercase tracking-wider text-[11px]",
                        isDarkTheme
                          ? "text-zinc-300 group-hover:text-white"
                          : "text-slate-800 group-hover:text-black"
                      )}
                    >
                      {section.name}
                    </span>
                  </div>

                  {/* Files inside section */}
                  {isOpen && (
                    <div className="flex flex-col">
                      {section.files.map((file, idx) => {
                        const isLast = idx === section.files.length - 1;
                        const guidePrefix = isLast ? "  └─ " : "  ├─ ";

                        return (
                          <TreeFileLink
                            key={file.href}
                            guidePrefix={guidePrefix}
                            name={file.name}
                            href={file.href}
                            badge={file.badge}
                            badgeType={file.badgeType}
                            currentPath={pathname}
                            isDark={isDarkTheme}
                            searchQuery={searchQuery}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom User / Session Section */}
      <div
        className={cn(
          "p-2.5 border-t",
          isDarkTheme ? "border-[#1A2333] bg-[#0A0D15]/80" : "border-[#E2E8F0] bg-white/80"
        )}
      >
        {collapsed ? (
          <div className="flex justify-center py-0.5">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm transition-all",
                isDarkTheme
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-[#0A192F] text-white border border-[#0A192F]"
              )}
              title="Hiten K. (Admin)"
            >
              HK
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className={cn("font-semibold", isDarkTheme ? "text-zinc-200" : "text-slate-800")}>
                  hiten@acme.inc
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold border",
                  isDarkTheme
                    ? "bg-white/10 text-zinc-300 border-zinc-700"
                    : "bg-[#0A192F] text-white border-[#0A192F]"
                )}
              >
                admin
              </span>
            </div>

            <div
              className={cn(
                "flex items-center justify-between text-[10px] pt-1",
                isDarkTheme ? "text-zinc-500" : "text-slate-600 font-medium"
              )}
            >
              <span>cirra-v1.4 (prod)</span>
              <Link
                href="/settings/profile"
                className={cn(
                  "underline underline-offset-2 flex items-center gap-0.5",
                  isDarkTheme ? "hover:text-zinc-200" : "text-slate-700 hover:text-[#0062E0]"
                )}
              >
                profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface TreeFileLinkProps {
  guidePrefix: string;
  name: string;
  href: string;
  badge?: string;
  badgeType?: "warning" | "info" | "success";
  currentPath: string;
  isDark: boolean;
  searchQuery?: string;
}

function TreeFileLink({
  guidePrefix,
  name,
  href,
  badge,
  badgeType = "warning",
  currentPath,
  isDark,
  searchQuery = "",
}: TreeFileLinkProps) {
  const isActive = currentPath === href;

  if (
    searchQuery &&
    !name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !href.toLowerCase().includes(searchQuery.toLowerCase())
  ) {
    return null;
  }

  return (
    <Link
      href={href}
      title={`${name} (${href})`}
      className={cn(
        "group flex items-center py-0.5 px-1 rounded transition-all cursor-pointer font-mono",
        isActive
          ? isDark
            ? "bg-white/10 text-white font-semibold border-l-2 border-[#38BDF8] pl-1.5"
            : "bg-blue-50 text-[#0062E0] font-semibold border-l-2 border-[#0062E0] pl-1.5"
          : isDark
          ? "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
      )}
    >
      {/* Tree guides */}
      {guidePrefix && (
        <span
          className={cn(
            "font-mono select-none mr-0.5",
            isDark ? "text-zinc-600 group-hover:text-zinc-500" : "text-slate-400"
          )}
        >
          {guidePrefix}
        </span>
      )}

      {/* Middle dot bullet: · */}
      <span
        className={cn(
          "mr-1.5 select-none font-bold",
          isActive
            ? isDark
              ? "text-[#38BDF8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
              : "text-[#0062E0]"
            : isDark
            ? "text-zinc-500 group-hover:text-zinc-300"
            : "text-slate-400 group-hover:text-slate-600"
        )}
      >
        ·
      </span>

      {/* Clean Filename without .tsx */}
      <span
        className={cn(
          "truncate transition-colors",
          isActive
            ? isDark
              ? "text-white"
              : "text-[#0062E0]"
            : isDark
            ? "text-zinc-300 group-hover:text-white"
            : "text-slate-700 group-hover:text-black"
        )}
      >
        {name}
      </span>

      {/* Badge (e.g. anomalies alert count) */}
      {badge && (
        <span
          className={cn(
            "ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded leading-none border select-none",
            badgeType === "warning"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
