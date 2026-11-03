"use client";

import React from "react";

import { UserRegistrationDialog } from "@/components/user-registration-dialog";
import { useUserStore } from "@/lib/store/user.store";

export default function RoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userToken } = useUserStore();

  if (!userToken) {
    return <UserRegistrationDialog defaultOpen={true} />;
  }

  return <>{children}</>;
}
