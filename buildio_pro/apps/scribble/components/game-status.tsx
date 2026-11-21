import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { cn } from "@workspace/ui/lib/utils";
import { Timer } from "lucide-react";
import type { ReactNode } from "react";

import { FinalResults } from "@/components/final-results";
import type { ScribbleState } from "@/components/game-room";
import type { StartGameProps } from "@/components/start-game-action";

export function GameStatus({
  match,
  userId,
  now,
  roomMenu,
  startGame,
}: {
  match: ScribbleState["match"];
  userId: Id<"users">;
  now: number;
  roomMenu: ReactNode;
  startGame: StartGameProps;
}) {
  if (!match) return null;

  if (match.phase === "finished") {
    return (
      <FinalResults
        key={match.id}
        scores={match.scores}
        roomMenu={roomMenu}
        startGame={startGame}
      />
    );
  }

  const seconds = Math.max(0, Math.ceil((match.endsAt - now) / 1000));
  const isDrawer = match.drawer.id === userId;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const revealing = match.phase === "reveal";
  const instruction = revealing
    ? "The answer was"
    : isDrawer
      ? "You’re drawing"
      : `${match.drawer.name} is drawing`;
  const word = revealing || isDrawer ? match.prompt : "Mystery word";
  const urgent = !revealing && seconds <= 10;

  return (
    <section
      className="flex min-h-12 shrink-0 items-center gap-1 px-2 py-1 lg:gap-3 lg:rounded-xl lg:border lg:bg-(--scribble-panel) lg:px-4 lg:py-2"
      aria-label="Current turn"
    >
      <div className="min-w-0 flex-1" role="status">
        <p className="wrap-break-word text-xs font-medium text-muted-foreground">
          {instruction}
          {!match.isPlaying && " · Spectating"}
          {!revealing && match.guessed && " · Guessed"}
        </p>
        <p className="wrap-break-word text-base leading-tight font-bold text-teal-800 sm:text-xl lg:text-2xl dark:text-teal-200">
          {word}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <p className="text-right text-[10px] text-muted-foreground sm:text-xs">
          Round {match.round}/{match.rounds} <span aria-hidden>·</span> Turn{" "}
          {match.turn}/{match.totalTurns}
        </p>
        <span
          role="timer"
          aria-label="Time remaining"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-base leading-tight font-semibold tabular-nums",
            urgent
              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
              : "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
          )}
        >
          <Timer className="size-4" aria-hidden />
          {time}
        </span>
      </div>
      {roomMenu}
    </section>
  );
}
