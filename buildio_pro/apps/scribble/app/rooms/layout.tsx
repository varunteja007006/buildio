"use client";

import { UserRegistration } from "@workspace/game-ui/components/user-registration";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";

export default function RoomLayout({ children }: { children: ReactNode }) {
  const { user, userToken } = useUserStore();
  const isRoom = Boolean(useSelectedLayoutSegment());

  if (userToken && user === undefined) {
    return (
      <p className="p-4 text-sm" role="status">
        Restoring guest session…
      </p>
    );
  }
  if (!user?.success) {
    return (
      <div className={isRoom ? "p-3" : undefined}>
        {isRoom && <Navbar />}
        <section className="mx-auto max-w-sm space-y-4 px-4 py-12">
          <h2 className="text-2xl font-semibold">Play as a guest</h2>
          <p className="text-sm text-muted-foreground">
            Choose a display name to join. No account is needed.
          </p>
          <UserRegistration className="w-full" joinOnRegister={false} />
        </section>
      </div>
    );
  }
  return children;
}
