"use client";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import * as React from "react";

import { RoomConfigProvider } from "../lib/room-config";
import { UserStoreProvider } from "../lib/store/user.store";
import { ConvexClientProvider } from "./convex-provider";

/**
 * Shared room-game provider stack: Convex client → room config → user store
 * → tooltip. Apps wrap their own ThemeProvider (and extras like
 * ClickEffectProvider) around this component.
 */
export function Providers({
  children,
  basePath = "rooms",
}: Readonly<{
  children: React.ReactNode;
  /** Route prefix for room pages, without leading/trailing slashes. */
  basePath?: string;
}>) {
  return (
    <ConvexClientProvider>
      <RoomConfigProvider basePath={basePath}>
        <UserStoreProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </UserStoreProvider>
      </RoomConfigProvider>
    </ConvexClientProvider>
  );
}
