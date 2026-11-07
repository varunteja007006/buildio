"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Badge } from "@workspace/ui/components/badge";
import { useQuery } from "convex/react";
import { Copy } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef } from "react";

import { CopyBtn } from "@/components/atoms/copy-btn";
import { ShareBtn } from "@/components/atoms/share-btn";
import {
  SnowflakeIcon,
  type SnowflakeIconHandle,
} from "@/components/snowflake-icon";
import { useUserStore } from "@/lib/store/user.store";

export function RoomHeader() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();
  const snowflakeRef = useRef<SnowflakeIconHandle>(null);

  const gameState = useQuery(
    api.secretSanta.getGameState,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );

  const minBudget = gameState?.min_budget;
  const maxBudget = gameState?.max_budget;

  const budgetLabel =
    minBudget && maxBudget
      ? `Gift budget: ${minBudget}–${maxBudget}`
      : maxBudget
        ? `Up to ${maxBudget}`
        : minBudget
          ? `From ${minBudget}`
          : null;

  return (
    <div className="flex w-full items-center justify-between gap-1">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary"
          onMouseEnter={() => snowflakeRef.current?.startAnimation()}
          onMouseLeave={() => snowflakeRef.current?.stopAnimation()}
        >
          <SnowflakeIcon
            ref={snowflakeRef}
            size={16}
            className="text-primary"
          />
          {gameState?.room?.room_name}
        </div>
        {budgetLabel ? (
          <Badge
            variant="secondary"
            className="p-1.5 text-secondary-foreground"
          >
            🎁 {budgetLabel}
          </Badge>
        ) : null}
        {gameState?.status === "drawn" && (
          <Badge
            variant="secondary"
            className="p-1.5 text-secondary-foreground"
          >
            🎉 Draw complete
          </Badge>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2">
        <CopyBtn
          text={roomCode as string}
          size={"sm"}
          variant="outline"
          tooltipText="Copy room code to share"
        >
          <Copy />
          Copy room code
        </CopyBtn>
        <ShareBtn size={"icon-sm"} variant="outline" />
      </div>
    </div>
  );
}
