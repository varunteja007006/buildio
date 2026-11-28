"use client";

import { getEmojiForUserId } from "@workspace/game-ui/lib/emoji";
import { Button } from "@workspace/ui/components/button";
import { Crown, X } from "lucide-react";

export function ParticipantCard({
  name,
  emojiId,
  emoji,
  isHost,
  actionsDisabled,
  onTransferHost,
  onKick,
}: Readonly<{
  name: string;
  emojiId: string;
  emoji?: string;
  isHost?: boolean;
  actionsDisabled?: boolean;
  onTransferHost?: () => void;
  onKick?: () => void;
}>) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-xl border border-primary/25 bg-white px-2 py-1.5 shadow dark:bg-secondary">
      <div className="flex min-w-0 flex-row items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-lg">
          {emoji ?? getEmojiForUserId(emojiId)}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1">
            <p className="truncate overflow-hidden text-[0.75rem] text-ellipsis capitalize text-primary font-semibold">
              {name}
            </p>
            {isHost && (
              <>
                <Crown
                  aria-hidden="true"
                  className="size-3 shrink-0 text-yellow-500 fill-yellow-500"
                />
                <span className="sr-only">Host</span>
              </>
            )}
          </div>
          <p className="text-[0.6rem] text-green-600 font-semibold">{`Joined ✅`}</p>
        </div>
      </div>
      {(onTransferHost || onKick) && (
        <div className="flex shrink-0 items-center gap-1">
          {onTransferHost && (
            <Button
              size="xs"
              variant="outline"
              onClick={onTransferHost}
              disabled={actionsDisabled}
              aria-label={`Make ${name} host`}
            >
              Make host
            </Button>
          )}
          {onKick && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onKick}
              disabled={actionsDisabled}
              aria-label={`Kick ${name}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
