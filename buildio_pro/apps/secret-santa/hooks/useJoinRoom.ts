"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { useUserStore } from "@/lib/store/user.store";

export function useJoinRoom() {
  const { userToken } = useUserStore();

  const convex = useConvex();
  const router = useRouter();
  const [isJoining, setIsJoining] = React.useState(false);

  const joinRoom = async (roomCode: string) => {
    if (!roomCode) {
      toast.error("Room code is required");
      return false;
    }

    if (!userToken) {
      toast.error("User not authenticated");
      return false;
    }

    setIsJoining(true);

    try {
      const checkResult = await convex.query(api.rooms.checkRoomExists, {
        roomCode,
      });

      if (!checkResult.success) {
        toast.error(checkResult.message);
        return false;
      }

      const joinResult = await convex.mutation(api.rooms.joinRoom, {
        roomCode,
        userToken,
      });

      if (joinResult.success) {
        toast.success(joinResult.message);
        router.push(`/rooms/${roomCode}`);
        return true;
      } else {
        toast.error(joinResult.message);
        return false;
      }
    } catch (error) {
      toast.error("Failed to join room");
      console.error(error);
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  return { joinRoom, isJoining };
}
