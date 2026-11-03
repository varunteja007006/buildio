"use client";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { UserStoreProvider } from "@/lib/store/user.store";

import { ConvexClientProvider } from "./convex-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ConvexClientProvider>
        <UserStoreProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </UserStoreProvider>
      </ConvexClientProvider>
    </NextThemesProvider>
  );
}
