"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import React from "react";

import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
  initialToken,
}: Readonly<{
  children: React.ReactNode;
  initialToken?: string | null;
}>) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      // @ts-expect-error upstream better-auth useSession types resolve to `never`
      // with the convex plugin — get-convex/better-auth#420, runtime unaffected
      authClient={authClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}