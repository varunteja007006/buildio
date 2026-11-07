"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useQuery } from "convex/react";
import { Play, Settings } from "lucide-react";
import { useParams } from "next/navigation";

import { CopyBtn } from "@/components/atoms/copy-btn";
import { ShareBtn } from "@/components/atoms/share-btn";
import { GameSettingsDialog } from "@/components/game-settings-dialog";
import { useUserStore } from "@/lib/store/user.store";

export function RoomHeader() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken, user } = useUserStore();

  const roomDetails = useQuery(api.rooms.getRoomDetails, {
    userToken,
    roomCode: roomCode as string,
  });

  const isOwner = roomDetails?.room?.ownerId === user?.id;

  return (
    <div className="w-full flex justify-end md:justify-between gap-1 items-center">
      <p className="font-bold text-sm text-primary hidden md:flex">
        {roomDetails?.room?.room_name}
      </p>

      <div className="flex flex-row items-center gap-1 justify-end">
        {isOwner && (
          <>
            <Button className="cursor-pointer" size="sm">
              <Play className="md:mr-2 h-4 w-4" />
              <span className="hidden md:flex">Start Game</span>
            </Button>

            <Tooltip>
              <GameSettingsDialog roomCode={roomCode as string}>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon-sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </GameSettingsDialog>
              <TooltipContent>
                <p>Game Settings</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <CopyBtn text={roomCode as string} size={"icon-sm"} variant="outline" />
        <ShareBtn size={"icon-sm"} variant="outline" />
      </div>
    </div>
  );
}
