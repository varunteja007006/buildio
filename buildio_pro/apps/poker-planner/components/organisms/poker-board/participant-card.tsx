import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import * as React from "react";

import { getEmojiForUserId } from "@/lib/utils";

import { Fireworks } from "./fireworks";
import { ConfettiSideCannons } from "./reaction-collection";

export function ParticipantCard({
  name,
  emoji,
  online,
  hasVoted,
  lastDisconnected,
  emojiId,
  isUser,
  index,
}: Readonly<{
  name: string;
  emoji?: string;
  online: boolean;
  hasVoted: boolean;
  lastDisconnected?: number;
  emojiId: string;
  isUser: boolean;
  index: number;
}>) {
  return (
    <div
      className="border-gray-300 flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-md bg-white p-2 pr-4 pl-2 shadow-lg animate-in fade-in slide-in-from-right-8 duration-500 ease-out dark:bg-secondary"
      style={{
        animationDelay: `${Math.min(index, 10) * 70}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="text-2xl">{emoji ?? getEmojiForUserId(emojiId)}</div>
        <div className="flex flex-col items-start">
          <p className="truncate overflow-hidden text-sm text-ellipsis capitalize text-primary font-semibold">
            {name}
          </p>

          {online ? (
            <p className="text-xs text-green-600 font-semibold">{`Online`}</p>
          ) : (
            lastDisconnected && (
              <p className="text-xs">{getTimeAgo(lastDisconnected)}</p>
            )
          )}
        </div>
      </div>
      <div className="ml-auto">
        {hasVoted && <div className="animate-bounce">👍</div>}
      </div>
      {isUser && (
        <div>
          <ReactionsMenu />
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
}

export function ReactionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex flex-col gap-1">
        <DropdownMenuItem asChild>
          <ConfettiSideCannons />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Fireworks />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
