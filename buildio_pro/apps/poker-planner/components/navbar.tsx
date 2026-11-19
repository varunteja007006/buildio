'use client';

import { Effect } from "@workspace/ui/components/animate-ui/primitives/effects/effect";
import { SplittingText } from "@workspace/ui/components/animate-ui/primitives/texts/splitting";
import { Kanban } from "lucide-react";
import Link from "next/link";

import { LogoutBtn } from "@/components/logout-btn";
import { ModeToggle } from "@/components/mode-toggle";
import { UserCard } from "@/components/user-card";

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between px-1 pb-1 md:mb-6 mb-3 md:px-2">
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
      <div className="flex items-center gap-2.5">
        <UserCard />
        <ModeToggle />
        <LogoutBtn />
      </div>
    </nav>
  );
}
