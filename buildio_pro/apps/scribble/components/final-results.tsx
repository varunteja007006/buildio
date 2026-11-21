"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ScribbleState } from "@/components/game-room";
import { PlayerAvatar } from "@/components/players-panel";
import {
  StartGameAction,
  type StartGameProps,
} from "@/components/start-game-action";

type Score = NonNullable<ScribbleState["match"]>["scores"][number];

const MEDALS = [
  {
    place: "1st",
    emoji: "🥇",
    position: "col-start-2",
    block:
      "h-24 border-amber-400 bg-amber-200 text-amber-950 dark:border-amber-500 dark:bg-amber-300",
  },
  {
    place: "2nd",
    emoji: "🥈",
    position: "col-start-1",
    block:
      "h-18 border-slate-400 bg-slate-200 text-slate-950 dark:border-slate-500 dark:bg-slate-300",
  },
  {
    place: "3rd",
    emoji: "🥉",
    position: "col-start-3",
    block:
      "h-14 border-orange-400 bg-orange-200 text-orange-950 dark:border-orange-500 dark:bg-orange-300",
  },
];

export function FinalResults({
  scores,
  roomMenu,
  startGame,
}: {
  scores: Score[];
  roomMenu: ReactNode;
  startGame: StartGameProps;
}) {
  const [open, setOpen] = useState(true);
  const podium: { rank: number; count: number; players: Score[] }[] = [];

  for (const [index, player] of scores.entries()) {
    const previous = podium.at(-1);
    if (previous?.count === player.count) {
      previous.players.push(player);
    } else if (index < MEDALS.length) {
      podium.push({ rank: index, count: player.count, players: [player] });
    } else {
      break;
    }
  }

  const first = podium[0];
  const best = first?.count ?? 0;
  const winnerNames = first?.players.map((player) => player.name).join(", ");
  const tied = (first?.players.length ?? 0) > 1;
  const summary =
    best === 0
      ? "No correct guesses this game."
      : tied
        ? `${winnerNames} tie for first with ${best} correct each.`
        : `${winnerNames} wins with ${best} correct ${best === 1 ? "guess" : "guesses"}.`;

  return (
    <section className="shrink-0 px-2 py-2 lg:rounded-xl lg:border lg:bg-(--scribble-panel) lg:px-3">
      <div className="flex items-center gap-1 lg:gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-xs font-semibold lg:text-sm">
            <Trophy
              className="size-4 shrink-0 text-teal-700 dark:text-teal-300"
              aria-hidden
            />
            Final results
          </h2>
          <p
            role="status"
            className="line-clamp-2 wrap-break-word text-sm lg:mt-1 lg:line-clamp-none lg:text-base"
          >
            {summary}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-11 lg:min-h-0">
              View results
            </Button>
          </DialogTrigger>
          <DialogContent
            className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg"
            showCloseButton={false}
          >
            <DialogHeader className="shrink-0 items-center bg-amber-50 px-4 py-4 text-center sm:text-center dark:bg-amber-950/50">
              <div className="flex items-center gap-2" aria-hidden>
                <span>✨</span>
                <Trophy className="size-7 text-amber-700 dark:text-amber-300" />
                <span>✨</span>
              </div>
              <DialogTitle className="text-2xl">Game over!</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
              <DialogDescription className="wrap-break-word text-center text-base font-medium text-foreground">
                {summary}
              </DialogDescription>
              {best > 0 && (
                <ol
                  className="grid grid-cols-3 items-end gap-1.5 sm:gap-3"
                  aria-label="Podium"
                >
                  {podium.map(({ rank, count, players }) => {
                    const medal = MEDALS[rank]!;
                    return (
                      <li
                        key={rank}
                        className={cn(
                          "row-start-1 flex min-w-0 flex-col gap-1.5 text-center",
                          medal.position,
                        )}
                      >
                        <ul className="space-y-2">
                          {players.map((player) => (
                            <li
                              key={player.id}
                              className="flex min-w-0 flex-col items-center gap-1"
                            >
                              <PlayerAvatar
                                name={player.name}
                                emoji={player.emoji}
                                size="lg"
                              />
                              <span className="max-w-full wrap-break-word text-xs font-semibold sm:text-sm">
                                {player.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground">
                          {count} correct
                        </p>
                        <div
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 rounded-t-xl border-b-4 text-lg font-black",
                            medal.block,
                          )}
                        >
                          <span aria-hidden>{medal.emoji}</span>
                          <span>{medal.place}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <ul
                className="flex flex-wrap justify-center gap-2 text-sm"
                aria-label="All scores"
              >
                {scores.map((player) => (
                  <li
                    key={player.id}
                    className="max-w-full wrap-break-word rounded-md bg-muted px-2 py-1"
                  >
                    {player.name} <span aria-hidden>·</span> {player.count}
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="shrink-0 items-stretch border-t px-4 py-3 sm:items-start">
              <DialogClose asChild>
                <Button variant="outline" className="min-h-11">
                  Back to room
                </Button>
              </DialogClose>
              <StartGameAction {...startGame} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {roomMenu}
      </div>
      {startGame.isHost && !open && (
        <div className="mt-2">
          <StartGameAction {...startGame} />
        </div>
      )}
    </section>
  );
}
