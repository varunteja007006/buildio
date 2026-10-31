"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

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
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </NextThemesProvider>
  );
}