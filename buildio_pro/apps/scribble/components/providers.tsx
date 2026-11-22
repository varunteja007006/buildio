"use client";

import { ClickEffectProvider } from "@workspace/game-ui/components/click-effect-provider";
import { Providers as SharedProviders } from "@workspace/game-ui/components/providers";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableColorScheme
    >
      <SharedProviders>
        <ClickEffectProvider>{children}</ClickEffectProvider>
      </SharedProviders>
    </NextThemesProvider>
  );
}
