"use client";

import { Crown, X } from "lucide-react";

import { getEmojiForUserId } from "@/lib/utils";

export function ParticipantCard({
  name,
  emojiId,
  isOwner,
  onKick,
}: Readonly<{
  name: string;
  emojiId: string;
  isOwner?: boolean;
  onKick?: () => void;
}>) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-xl border border-primary/25 bg-white px-2 py-1.5 shadow dark:bg-secondary">
      <div className="flex flex-row items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent text-lg">
          {getEmojiForUserId(emojiId)}
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <p className="truncate overflow-hidden text-[0.75rem] text-ellipsis capitalize text-primary font-semibold">
              {name}
            </p>
            {isOwner && (
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <p className="text-[0.6rem] text-green-600 font-semibold">{`Joined ✅`}</p>
        </div>
      </div>
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          aria-label={`Kick ${name}`}
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
