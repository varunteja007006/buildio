'use client';

import { LogoutBtn } from "@workspace/game-ui/components/logout-btn";
import { Navbar as SharedNavbar } from "@workspace/game-ui/components/navbar";
import { PaletteToggle } from "@workspace/game-ui/components/palette-toggle";
import { UserCard } from "@workspace/game-ui/components/user-card";
import { Effect } from "@workspace/ui/components/animate-ui/primitives/effects/effect";
import { SplittingText } from "@workspace/ui/components/animate-ui/primitives/texts/splitting";
import { Kanban } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <SharedNavbar
      brand={
        <Link href={"/"}>
          <div className="flex items-center gap-2.5">
            <Effect
              slide={{ direction: "up", offset: 8 }}
              fade
              delay={150}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex"
            >
              <Kanban className="text-primary size-8" />
            </Effect>
            <h1 className="text-primary text-xl font-bold">
              <SplittingText
                text="Poker Planner"
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
        <>
          <UserCard roomNoun="poker room" />
          <PaletteToggle />
          <LogoutBtn />
        </>
      }
    />
  );
}
