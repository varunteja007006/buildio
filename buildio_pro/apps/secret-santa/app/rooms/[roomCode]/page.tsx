"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DrawControl } from "@/components/draw-control";
import { MyMatchCard } from "@/components/my-match-card";
import { PairingReveal } from "@/components/pairing-reveal";
import { Participants } from "@/components/participants";
import { RecipientWishlist } from "@/components/recipient-wishlist";
import { RoomHeader } from "@/components/room-header";
import { WishlistEditor } from "@/components/wishlist-editor";

type EntryState =
  | { status: "joining" | "joined" }
  | { status: "unavailable" | "failed"; message: string };

export default function RoomPage() {
  const { user, userToken } = useUserStore();
  const { roomCode } = useParams<{ roomCode: string }>();

  if (user === undefined) {
    return <RoomEntryStatus message="Checking your profile…" />;
  }

  if (!user?.success) {
    return (
      <RoomEntryStatus
        message="Your profile is unavailable. Return home to set up your profile again."
        exitHref="/"
      />
    );
  }

  return (
    <RoomSession
      key={JSON.stringify([roomCode, userToken])}
      roomCode={roomCode}
      userToken={userToken}
      userId={user.id}
    />
  );
}

function RoomEntryStatus({
  message,
  exitHref,
  onRetry,
}: {
  message: string;
  exitHref?: "/" | "/rooms";
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 p-4 text-center">
      <p role="status">{message}</p>
      <div className="flex gap-2">
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
        {exitHref === "/" && (
          <Button variant="outline" onClick={() => window.location.assign("/")}>
            Back to home
          </Button>
        )}
        {exitHref === "/rooms" && (
          <Button asChild variant="outline">
            <Link href="/rooms">Back to rooms</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function RoomSession({
  roomCode,
  userToken,
  userId,
}: {
  roomCode: string;
  userToken: string;
  userId: string;
}) {
  const [entry, setEntry] = useState<EntryState>({ status: "joining" });
  const [attempt, setAttempt] = useState(0);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const initializeGame = useMutation(api.secretSanta.initializeGame);
  const gameState = useQuery(
    api.secretSanta.getGameState,
    entry.status === "joined" ? { roomCode, userToken } : "skip",
  );

  useEffect(() => {
    let active = true;

    async function enterRoom() {
      try {
        const result = await joinRoom({ roomCode, userToken });
        if (!active) return;
        if (!result.success) {
          setEntry({
            status:
              result.message === "Room not found" ? "unavailable" : "failed",
            message: result.message,
          });
          return;
        }

        // The mutation initializes the game for the host and is a no-op for guests.
        await initializeGame({ roomCode, userToken });
        if (active) setEntry({ status: "joined" });
      } catch {
        if (active) {
          setEntry({
            status: "failed",
            message: "Could not enter the room. Please try again.",
          });
        }
      }
    }

    void enterRoom();
    return () => {
      active = false;
    };
  }, [attempt, initializeGame, joinRoom, roomCode, userToken]);

  function retry() {
    setEntry({ status: "joining" });
    setAttempt((count) => count + 1);
  }

  if (entry.status === "unavailable" || entry.status === "failed") {
    return (
      <RoomEntryStatus
        message={entry.message}
        exitHref="/rooms"
        onRetry={entry.status === "failed" ? retry : undefined}
      />
    );
  }

  if (entry.status === "joining" || gameState === undefined) {
    return <RoomEntryStatus message="Joining the room…" exitHref="/rooms" />;
  }

  if (!gameState.success) {
    return <RoomEntryStatus message={gameState.message} exitHref="/rooms" />;
  }

  const isHost = gameState.room?.hostId === userId;
  const isDrawn = gameState?.status === "drawn";
  const myRecipientUsername = gameState?.my_recipient?.username;

  return (
    <div className="flex w-full flex-col gap-4 space-y-4 p-2 md:p-8 min-h-[calc(100vh-10rem)]">
      <RoomHeader />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isHost ? (
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
          {gameState.reveal && (
            <PairingReveal
              roomCode={roomCode}
              userToken={userToken}
              reveal={gameState.reveal}
              participants={gameState.participants}
            />
          )}
        </div>
      </div>
    </div>
  );
}
