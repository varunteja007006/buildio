import { getEmojiForUserId } from "@workspace/game-ui/lib/emoji";
import { Crown } from "lucide-react";

export function ParticipantCard({
  name,
  online,
  lastDisconnected,
  emojiId,
  isOwner,
}: Readonly<{
  name: string;
  online: boolean;
  lastDisconnected?: number;
  emojiId: string;
  isOwner?: boolean;
}>) {
  return (
    <div className="border-primary/25 min-w-[180px] flex w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-md border bg-white px-1.5 py-1 shadow dark:bg-secondary">
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

          {online ? (
            <p className="text-[0.6rem] text-green-600 font-semibold">{`Online`}</p>
          ) : (
            lastDisconnected && (
              <p className="text-xs">{getTimeAgo(lastDisconnected)}</p>
            )
          )}
        </div>
      </div>
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
