'use client';

import { Navbar as SharedNavbar } from "@workspace/game-ui/components/navbar";
import { Effect } from "@workspace/ui/components/animate-ui/primitives/effects/effect";
import { SplittingText } from "@workspace/ui/components/animate-ui/primitives/texts/splitting";
import Link from "next/link";

export function Navbar() {
  return (
    <SharedNavbar
      className="flex w-full items-center justify-between px-2 py-1"
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
              <span className="text-xl">🎄</span>
            </Effect>
            <h1 className="text-primary text-xl font-bold">
              <SplittingText
                text="Secret Santa"
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
    />
  );
}