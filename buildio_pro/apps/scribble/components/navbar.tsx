"use client";

import { LogoutBtn } from "@workspace/game-ui/components/logout-btn";
import { Navbar as SharedNavbar } from "@workspace/game-ui/components/navbar";
import { UserCard } from "@workspace/game-ui/components/user-card";
import { Effect } from "@workspace/ui/components/animate-ui/primitives/effects/effect";
import { SplittingText } from "@workspace/ui/components/animate-ui/primitives/texts/splitting";
import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function Navbar({
  roomDetails,
  roomActions,
}: {
  roomDetails?: ReactNode;
  roomActions?: ReactNode;
} = {}) {
  if (roomDetails) {
    return (
      <nav
        aria-label="Room navigation"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md text-sm font-bold"
          >
            <Pencil className="size-4 text-teal-700 dark:text-teal-300" />
            Scribble
          </Link>
          {roomDetails}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {roomActions}
          <div className="flex max-w-full items-center gap-1.5 border-l pl-2 [&>[aria-label='User_menu']]:mr-0 [&>[aria-label='User_menu']>p]:max-w-28 [&>[aria-label='User_menu']>p]:truncate">
            <UserCard roomNoun="Scribble room" />
            <LogoutBtn />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <SharedNavbar
      brand={
        <Link href={"/"}>
          <div className="flex items-center gap-2">
            <Effect
              slide={{ direction: "up", offset: 8 }}
              fade
              delay={150}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex"
            >
              <Pencil className="text-primary size-4" />
            </Effect>
            <h1 className="text-primary text-base font-bold">
              <SplittingText
                text="Scribble"
                type="words"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                stagger={0.15}
              />
            </h1>
          </div>
        </Link>
      }
      right={
        <div className="flex items-center gap-2.5">
          <UserCard />
          <LogoutBtn />
        </div>
      }
    />
  );
}
