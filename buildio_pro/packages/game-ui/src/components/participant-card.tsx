"use client";

import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { Crown, X } from "lucide-react";
import * as React from "react";

import { getEmojiForUserId } from "../lib/emoji";
import { getTimeAgo } from "../lib/time-ago";
import { ROLE_LABELS, type Role } from "../lib/validators";

/**
 * Game-agnostic participant card. Game-specific extras are provided through
 * optional slots: `actions` (e.g. poker's reactions menu), `onKick`
 * (secret-santa), `isOwner` crown, and `statusText` for games without
 * presence (e.g. "Joined ✅").
 */
export function ParticipantCard({
  name,
  emoji,
  emojiId,
  role,
  online,
  lastDisconnected,
  statusText,
  isOwner,
  hasVoted,
  index = 0,
  actions,
  onKick,
  className,
}: Readonly<{
  name: string;
  emojiId: string;
  /** Explicit profile emoji; falls back to a hash-derived one. */
  emoji?: string;
  /** Participant role, shown as a badge next to the name. */
  role?: Role;
  online?: boolean;
  lastDisconnected?: number;
  /** Static status line, used by games without presence. */
  statusText?: string;
  isOwner?: boolean;
  isUser?: boolean;
  hasVoted?: boolean;
  /** Position in the list, drives the staggered entry animation. */
  index?: number;
  /** Extra per-participant controls, rendered on the right. */
  actions?: React.ReactNode;
  onKick?: () => void;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "border-gray-300 flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-md bg-white p-2 pr-4 pl-2 shadow-lg animate-in fade-in slide-in-from-right-8 duration-500 ease-out dark:bg-secondary",
        className,
      )}
      style={{
        animationDelay: `${Math.min(index, 10) * 70}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="text-2xl">{emoji ?? getEmojiForUserId(emojiId)}</div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <p className="truncate overflow-hidden text-sm text-ellipsis capitalize text-primary font-semibold">
              {name}
            </p>
            {role && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {ROLE_LABELS[role]}
              </Badge>
            )}
            {isOwner && (
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>

          {online !== undefined || lastDisconnected !== undefined ? (
            online ? (
              <p className="text-xs text-green-600 font-semibold">{`Online`}</p>
            ) : (
              lastDisconnected && (
                <p className="text-xs">{getTimeAgo(lastDisconnected)}</p>
              )
            )
          ) : (
            statusText && (
              <p className="text-xs text-green-600 font-semibold">
                {statusText}
              </p>
            )
          )}
        </div>
      </div>
      <div className="ml-auto">
        {hasVoted && <div className="animate-bounce">👍</div>}
      </div>
      {actions && <div>{actions}</div>}
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
