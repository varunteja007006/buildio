"use client";

import { ClickEffectProvider } from "@workspace/game-ui/components/click-effect-provider";
import { Providers as SharedProviders } from "@workspace/game-ui/components/providers";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";


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
      <SharedProviders basePath="room">
        <ClickEffectProvider>{children}</ClickEffectProvider>
      </SharedProviders>
    </NextThemesProvider>
  );
}
