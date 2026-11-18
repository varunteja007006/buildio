"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { ChatBox } from "@/components/chat-box";
import { Participants } from "@/components/participants";
import { RoomHeader } from "@/components/room-header";
import { useUserStore } from "@/lib/store/user.store";

const Canvas = dynamic(
  () => import("@/components/canvas").then((mod) => mod.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        Loading Canvas...
      </div>
    ),
  },
);

export default function RoomPage() {
  const { user, userToken } = useUserStore();
  const params = useParams();
  const roomCode = params.roomCode as string;

  const roomDetails = useQuery(api.rooms.getRoomDetails, {
    userToken,
    roomCode,
  });
  const initializeSettings = useMutation(api.scribble.initializeGameSettings);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const isOwner =
    user?.success === true && roomDetails?.room?.ownerId === user.id;

  // Initialize default game settings when owner joins
  useEffect(() => {
    if (isOwner && userToken && roomCode) {
      initializeSettings({ roomCode, userToken }).catch(console.error);
    }
    if (userToken && roomCode) {
      joinRoom({ roomCode, userToken }).catch(console.error);
    }
  }, [isOwner, userToken, roomCode, initializeSettings, joinRoom]);

  if (user?.success !== true) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-1 md:gap-2 p-1 md:px-2 md:py-4 h-[calc(100vh-10rem)] overflow-hidden">
      <div className="flex flex-col min-w-0 min-h-0 flex-1 gap-1">
        <RoomHeader />

        <div className="flex-1 min-h-0 w-full bg-muted/20 rounded-md border overflow-hidden">
          <Canvas />
        </div>
      </div>

      <div className="flex flex-row md:flex-col gap-1 h-56 md:h-full md:w-60 shrink-0">
        <div className="w-36 md:w-full min-h-0 overflow-y-auto">
          <Participants />
        </div>
        <div className="flex-1 min-w-0 min-h-0">
          <ChatBox roomCode={roomCode} />
        </div>
      </div>
    </div>
  );
}
