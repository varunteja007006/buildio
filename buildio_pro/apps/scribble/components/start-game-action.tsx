"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useMutation } from "convex/react";
import { Play, Settings2 } from "lucide-react";
import { useState } from "react";

import { GameSettingsDialog } from "@/components/game-settings-dialog";
import { getGameError } from "@/lib/game-error";

export type StartGameProps = {
  roomCode: string;
  isHost: boolean;
  hostName: string;
  onlineCount: number;
  previousMatchId: Id<"scribble_matches"> | null;
};

export function StartGameAction({
  roomCode,
  isHost,
  hostName,
  onlineCount,
  previousMatchId,
}: StartGameProps) {
  const { userToken } = useUserStore();
  const start = useMutation(api.scribbleMatch.start);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!isHost) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Waiting for{" "}
        <strong className="font-semibold text-foreground">{hostName}</strong> to{" "}
        {previousMatchId ? "start the next game" : "start"}.
      </p>
    );
  }

  async function handleStart() {
    if (pending || onlineCount < 2) return;
    setPending(true);
    setError("");
    try {
      await start({ roomCode, userToken, previousMatchId });
    } catch (cause) {
      setError(getGameError(cause, "Could not start the game. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full space-y-2 lg:w-fit">
      <div className="grid grid-cols-1 gap-2 lg:flex">
        <div className="hidden lg:block">
          <GameSettingsDialog roomCode={roomCode}>
            <Button variant="outline" className="min-h-11 px-3">
              <Settings2 aria-hidden />
              Settings
            </Button>
          </GameSettingsDialog>
        </div>
        <Button
          className="min-h-11 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-300 dark:text-zinc-950 dark:hover:bg-teal-200"
          disabled={pending || onlineCount < 2}
          onClick={() => void handleStart()}
        >
          <Play aria-hidden />
          {pending ? "Starting…" : previousMatchId ? "Play again" : "Start game"}
        </Button>
      </div>
      {onlineCount < 2 && (
        <p className="text-xs text-muted-foreground">
          Waiting for a second player.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
