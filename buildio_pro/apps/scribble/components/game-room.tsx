"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ChatBox } from "@/components/chat-box";
import { GameStatus } from "@/components/game-status";
import { MobilePlayersButton, PlayersPanel } from "@/components/players-panel";
import { MobileRoomMenu, RoomHeader } from "@/components/room-header";
import { StartGameAction } from "@/components/start-game-action";

const Canvas = dynamic(
  () => import("@/components/canvas").then((mod) => mod.Canvas),
  {
    ssr: false,
    loading: () => (
      <p
        className="grid aspect-4/3 max-h-[48svh] place-items-center p-4 lg:h-full lg:max-h-none lg:aspect-auto"
        role="status"
      >
        Loading canvas…
      </p>
    ),
  },
);

export type ScribbleState = FunctionReturnType<
  typeof api.scribbleMatch.getState
>;
const PRESENCE_WINDOW_MS = 45_000;

export function GameRoom({
  roomCode,
  userToken,
}: {
  roomCode: string;
  userToken: string;
}) {
  const { user } = useUserStore();
  const state = useQuery(api.scribbleMatch.getState, { roomCode, userToken });
  const heartbeat = useMutation(api.scribbleRooms.heartbeat);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let pending = false;
    function ping() {
      if (pending) return;
      pending = true;
      void heartbeat({ roomCode, userToken })
        .catch(() => {
          // Reconnect or the next heartbeat will retry.
        })
        .finally(() => {
          pending = false;
        });
    }
    const interval = window.setInterval(ping, 15_000);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("online", ping);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("online", ping);
    };
  }, [heartbeat, roomCode, userToken]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, []);

  if (!state || user?.success !== true) {
    return (
      <p className="p-4" role="status">
        Loading game…
      </p>
    );
  }

  const { match } = state;
  const canDraw =
    match?.phase === "drawing" &&
    match.drawer.id === user.id &&
    now < match.endsAt;
  const members = state.members.filter(
    (guest) => guest.seenAt > now - PRESENCE_WINDOW_MS,
  );
  const { roomCode: code, isHost, hostName, hostId, ownerId } = state;
  const players = {
    match,
    members,
    userId: user.id,
    roomCode: code,
    hostId,
    ownerId,
    isHost,
  };
  const startGame = {
    roomCode: code,
    isHost,
    hostName: hostName ?? "the host",
    onlineCount: members.length,
    previousMatchId: match?.id ?? null,
  };
  const room = { state };
  const roomMenu = <MobileRoomMenu {...room} />;

  return (
    <div className="flex h-dvh flex-col gap-2 p-2 sm:gap-3 sm:p-3 lg:min-h-[34rem]">
      <RoomHeader {...room} />
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(11rem,1fr)] gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_clamp(17.5rem,24vw,20rem)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-(--scribble-panel) lg:gap-3 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
          {match ? (
            <GameStatus
              match={match}
              userId={user.id}
              now={now}
              roomMenu={roomMenu}
              startGame={startGame}
            />
          ) : (
            <header className="flex items-center justify-between gap-2 px-2 py-1 lg:hidden">
              <h1 className="min-w-0 truncate pl-1 text-sm font-semibold">
                {state.roomName}
              </h1>
              {roomMenu}
            </header>
          )}
          <div className="min-w-0 overflow-hidden border-t bg-(--scribble-matte) lg:min-h-0 lg:flex-1 lg:rounded-xl lg:border">
            {match ? (
              <Canvas
                key={match.canvasId}
                roomCode={state.roomCode}
                userToken={userToken}
                canvasId={match.canvasId}
                canDraw={canDraw}
              />
            ) : (
              <div className="grid min-h-36 place-items-center p-4 text-center lg:h-full">
                <StartGameAction {...startGame} />
              </div>
            )}
          </div>
        </div>
        <aside className="flex min-h-0 min-w-0 flex-col gap-2 sm:gap-3">
          <div className="min-h-0 min-w-0 flex-1 lg:order-2">
            <ChatBox
              roomCode={state.roomCode}
              turnKey={match?.turnKey ?? null}
              participants={
                <MobilePlayersButton
                  key={match?.phase === "finished" ? match.id : "active"}
                  {...players}
                />
              }
              canGuess={
                match?.phase === "drawing" &&
                match.isPlaying &&
                match.drawer.id !== user.id &&
                !match.guessed &&
                now < match.endsAt
              }
            />
          </div>
          <div className="hidden min-h-0 lg:contents">
            <PlayersPanel {...players} />
          </div>
        </aside>
      </div>
    </div>
  );
}
