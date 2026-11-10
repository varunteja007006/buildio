"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { DrawControl } from "@/components/draw-control";
import { MyMatchCard } from "@/components/my-match-card";
import { Participants } from "@/components/participants";
import { RecipientWishlist } from "@/components/recipient-wishlist";
import { RoomHeader } from "@/components/room-header";
import { WishlistEditor } from "@/components/wishlist-editor";
import { useUserStore } from "@/lib/store/user.store";

export default function RoomPage() {
  const { user, userToken } = useUserStore();
  const params = useParams();
  const roomCode = params.roomCode as string;

  const gameState = useQuery(api.secretSanta.getGameState, {
    roomCode,
    userToken,
  });
  const initializeGame = useMutation(api.secretSanta.initializeGame);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const isOwner = gameState?.room?.ownerId === user?.id;

  // Initialize the game doc when the owner joins, and (re)join the room
  // so membership is always up to date.
  useEffect(() => {
    if (isOwner && userToken && roomCode) {
      initializeGame({ roomCode, userToken }).catch(console.error);
    }
    if (userToken && roomCode) {
      joinRoom({ roomCode, userToken }).catch(console.error);
    }
  }, [isOwner, userToken, roomCode, initializeGame, joinRoom]);

  if (!user?.id) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <p>Loading… 🎄</p>
      </div>
    );
  }

  const isDrawn = gameState?.status === "drawn";
  const myRecipientUsername = gameState?.my_recipient?.username;

  return (
    <div className="flex w-full flex-col gap-4 space-y-4 p-2 md:p-8 min-h-[calc(100vh-10rem)]">
      <RoomHeader />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isOwner ? (
            <DrawControl
              status={gameState?.status ?? "lobby"}
              pendingParticipants={gameState?.pending_participants ?? 0}
              minBudget={gameState?.min_budget}
              maxBudget={gameState?.max_budget}
            />
          ) : null}
          <MyMatchCard
            status={isDrawn ? "drawn" : "lobby"}
            myRecipientUsername={myRecipientUsername}
          />
          {isDrawn && myRecipientUsername ? (
            <RecipientWishlist myRecipientUsername={myRecipientUsername} />
          ) : null}
          <WishlistEditor />
        </div>

        <div className="space-y-4">
          <Participants />
        </div>
      </div>
    </div>
  );
}
