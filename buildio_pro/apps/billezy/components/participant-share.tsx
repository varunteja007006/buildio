"use client";

import { UserRound } from "lucide-react";

/** Compact badge showing how many people share an expense. */
export function ParticipantShare({
  count,
  total,
  names,
}: {
  count: number;
  total: number;
  names: string;
}) {
  return (
    <span
      title={`Shared by ${names}`}
      className="order-last flex w-full items-start gap-1 text-xs text-muted-foreground sm:order-none sm:w-auto sm:max-w-48"
    >
      <UserRound className="mt-0.5 size-3.5 shrink-0" />
      <span className="break-words">
        {count === total ? "Everyone" : names}
      </span>
    </span>
  );
}
