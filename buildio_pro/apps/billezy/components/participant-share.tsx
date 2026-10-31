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
  if (count === total) {
    return (
      <span
        title={`Shared by everyone (${names})`}
        className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"
      >
        <UserRound className="size-3.5" />
        all
      </span>
    );
  }
  return (
    <span
      title={`Shared by ${names}`}
      className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"
    >
      <UserRound className="size-3.5" />
      {count}
    </span>
  );
}