"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { CursorEffect } from "@/components/ui/CursorEffect";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  React.useEffect(() => {
    const purgeDevOverlay = () => {
      const elements = document.querySelectorAll(
        "nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay], #__next-build-watcher, [data-nextjs-dev-tools], [data-nextjs-dev-tools-button]"
      );
      elements.forEach((el) => {
        el.remove();
      });
    };

    purgeDevOverlay();
    const observer = new MutationObserver(() => {
      purgeDevOverlay();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalBackground />
      <CursorEffect />
      <div className="relative z-10 min-h-screen">{children}</div>
    </QueryClientProvider>
  );
}
