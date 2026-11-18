"use client";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { UserStoreProvider } from "@/lib/store/user.store";

import { ConvexClientProvider } from "./convex-provider";

export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      storageKey="poker-planner-appearance"
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
