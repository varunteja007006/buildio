"use client";

import * as React from "react";

import { useUserStore } from "../lib/store/user.store";
import { UserRegistrationDialog } from "./user-registration-dialog";

/**
 * Gate for room routes: renders children only once a user token exists,
 * otherwise shows the registration dialog. Used by each app's room layout.
 */
export function RoomGate({
  children,
  askRole = false,
}: Readonly<{
  children: React.ReactNode;
  /** Ask for the participant role during registration (poker planner only). */
  askRole?: boolean;
}>) {
  const { userToken } = useUserStore();

  if (!userToken) {
    return <UserRegistrationDialog defaultOpen={true} askRole={askRole} />;
  }

  return <>{children}</>;
}