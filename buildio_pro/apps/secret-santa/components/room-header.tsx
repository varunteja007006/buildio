"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Badge } from "@workspace/ui/components/badge";
import { useQuery } from "convex/react";
import { Copy } from "lucide-react";
import { useParams } from "next/navigation";

import { CopyBtn } from "@/components/atoms/copy-btn";
import { useUserStore } from "@/lib/store/user.store";

export function RoomHeader() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const gameState = useQuery(
    api.secretSanta.getGameState,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );

  return (
    <div className="flex w-full items-center justify-between gap-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-primary">
          {gameState?.room?.room_name}
        </p>
        {gameState?.status === "drawn" && (
          <Badge variant="secondary" className="text-secondary-foreground">
            🎁 Draw complete
          </Badge>
        )}
      </div>
      <CopyBtn
        text={roomCode as string}
        size={"sm"}
        variant="outline"
        tooltipText="Copy room code to share"
      >
        <Copy />
        Copy room code
      </CopyBtn>
    </div>
  );
}
