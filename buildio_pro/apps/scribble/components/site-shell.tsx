"use client";

import { PageTransition } from "@workspace/ui/components/animate-ui/components/page-transition";
import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { useSelectedLayoutSegments } from "next/navigation";
import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";

export function SiteShell({ children }: { children: ReactNode }) {
  const [section, room] = useSelectedLayoutSegments();
  const isRoom = section === "rooms" && Boolean(room);

  if (isRoom) {
    return (
      <main className="scribble-room min-h-dvh bg-zinc-100 dark:bg-zinc-950">
        <PageTransition effect="stack">{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-secondary p-2 md:p-4">
        <section className="min-h-[calc(100svh-3rem)] rounded-lg border border-border bg-background p-2 sm:min-h-[calc(100svh-5rem)] md:px-4 md:py-6">
          <Navbar />
          <PageTransition effect="stack">{children}</PageTransition>
        </section>
      </main>
      <div className="bg-secondary px-2 pb-4 md:px-4 md:pb-8">
        <div className="rounded-lg border border-border bg-background py-5">
          <MoreAppsFooter current="scribble" />
        </div>
      </div>
    </>
  );
}
