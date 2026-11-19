"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { useRoomConfig } from "../lib/room-config";
import { useUserStore } from "../lib/store/user.store";

export function useJoinRoom() {
  const { basePath } = useRoomConfig();
  const { userToken } = useUserStore();

  const convex = useConvex();
  const router = useRouter();
  const [isJoining, setIsJoining] = React.useState(false);

  const joinRoom = React.useCallback(
    async (roomCode: string) => {
      if (!roomCode) {
        toast.error("Room code is required");
        return "failed" as const;
      }

      if (!userToken) {
        toast.error("User not authenticated");
        return "failed" as const;
      }

      setIsJoining(true);

      try {
        const checkResult = await convex.query(api.rooms.checkRoomExists, {
          roomCode,
        });

        if (!checkResult.success) {
          toast.error("No room found");
          return "not-found" as const;
        }

        const joinResult = await convex.mutation(api.rooms.joinRoom, {
          roomCode,
          userToken,
        });

        if (joinResult.success) {
          router.push(`/${basePath}/${roomCode}`);
          return "joined" as const;
        } else {
          toast.error(joinResult.message);
          return "failed" as const;
        }
      } catch (error) {
        toast.error("Failed to join room");
        console.error(error);
        return "failed" as const;
      } finally {
        setIsJoining(false);
      }
    },
    [convex, router, userToken, basePath],
  );

  return { joinRoom, isJoining };
}
