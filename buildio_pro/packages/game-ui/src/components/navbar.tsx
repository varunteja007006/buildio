'use client';

import * as React from "react";

import { LogoutBtn } from "./logout-btn";
import { ModeToggle } from "./mode-toggle";
import { UserCard } from "./user-card";

/**
 * Shared room-game navbar skeleton. Apps pass their own `brand` (logo/title
 * inside a Link) and may override `right` with a custom action cluster;
 * by default it renders the shared UserCard / ModeToggle / LogoutBtn trio.
 */
export function Navbar({
  brand,
  right,
  className = "flex w-full items-center justify-between px-1 pb-1 md:mb-6 mb-3 md:px-2",
}: Readonly<{
  brand: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}>) {
  return (
    <nav className={className}>
      {brand}
      <div className="flex items-center gap-2.5">
        {right ?? (
          <>
            <UserCard />
            <ModeToggle />
            <LogoutBtn />
          </>
        )}
      </div>
    </nav>
  );
}