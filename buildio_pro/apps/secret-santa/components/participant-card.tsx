"use client";

import { Crown } from "lucide-react";

import { getEmojiForUserId } from "@/lib/utils";

export function ParticipantCard({
  name,
  emojiId,
  isOwner,
}: Readonly<{
  name: string;
  emojiId: string;
  isOwner?: boolean;
}>) {
  return (
    <div className="border-primary/25 flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-md border bg-white px-1.5 py-1 shadow dark:bg-secondary">
      <div className="flex flex-row items-center gap-2">
        <div className="text-base">{getEmojiForUserId(emojiId)}</div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <p className="truncate overflow-hidden text-[0.75rem] text-ellipsis capitalize text-primary font-semibold">
              {name}
            </p>
            {isOwner && (
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <p className="text-[0.6rem] text-green-600 font-semibold">{`Joined`}</p>
        </div>
      </div>
    </div>
  );
}
