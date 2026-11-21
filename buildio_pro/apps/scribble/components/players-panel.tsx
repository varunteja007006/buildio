import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@workspace/ui/components/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { ChevronUp, Crown, Users } from "lucide-react";

import type { ScribbleState } from "@/components/game-room";
import { PlayerHostAction } from "@/components/player-host-action";

type PlayersProps = {
  match: ScribbleState["match"];
  members: ScribbleState["members"];
  userId: Id<"users">;
  roomCode: string;
  hostId: Id<"users">;
  ownerId: Id<"users">;
  isHost: boolean;
};

type RosterPlayer = {
  id: Id<"users">;
  name: string;
  emoji?: string;
  score: number | null;
  role?: string;
};

export function PlayerAvatar({
  name,
  emoji,
  size = "sm",
}: {
  name: string;
  emoji?: string;
  size?: "sm" | "default" | "lg";
}) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <Avatar size={size} aria-hidden>
      <AvatarFallback>{emoji ?? initial}</AvatarFallback>
    </Avatar>
  );
}

function getRoster(
  { match, members, userId }: PlayersProps,
  includeFinal: boolean,
): RosterPlayer[] {
  if (!match || (match.phase === "finished" && !includeFinal)) {
    return members.map((member) => ({ ...member, score: null }));
  }
  const scores = match.scores.map(({ count, ...player }) => ({
    ...player,
    score: count,
    role:
      match.phase === "drawing" && player.id === match.drawer.id
        ? "Drawing"
        : match.phase !== "finished" && player.id === userId && match.guessed
          ? "Guessed"
          : undefined,
  }));
  const participantIds = new Set(scores.map((player) => player.id));
  return [
    ...scores,
    ...members
      .filter((member) => !participantIds.has(member.id))
      .map((member) => ({
        ...member,
        score: null,
        role: match.phase === "finished" ? "Guest" : "Spectating",
      })),
  ];
}

function PlayerRow({
  player,
  players,
}: {
  player: RosterPlayer;
  players: PlayersProps;
}) {
  const { members, userId, hostId, ownerId, isHost, roomCode } = players;
  const isRoomHost = player.id === hostId;
  const isOwner = player.id === ownerId;
  const canTransfer =
    isHost && !isRoomHost && members.some((member) => member.id === player.id);

  return (
    <li className="flex min-h-10 items-center gap-2 rounded-md px-1.5 py-1.5">
      <PlayerAvatar name={player.name} emoji={player.emoji} />
      <div className="min-w-0 flex-1">
        <p className="wrap-break-word font-medium">
          {player.name}
          {player.id === userId && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (you)
            </span>
          )}
        </p>
        {(isRoomHost || isOwner || player.role) && (
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
            {isRoomHost && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300">
                <Crown className="size-3" aria-hidden /> Host
              </span>
            )}
            {isOwner && (
              <span className="font-medium text-violet-800 dark:text-violet-300">
                Owner
              </span>
            )}
            {player.role && (
              <span className="text-muted-foreground">{player.role}</span>
            )}
          </div>
        )}
      </div>
      {player.score !== null && (
        <span className="min-w-5 text-right font-semibold tabular-nums">
          <span className="sr-only">Score </span>
          {player.score}
        </span>
      )}
      {canTransfer && <PlayerHostAction roomCode={roomCode} guest={player} />}
    </li>
  );
}

export function PlayersPanel(props: PlayersProps) {
  const { match, members } = props;
  const active = match && match.phase !== "finished";
  return (
    <section className="flex max-h-[35%] min-h-0 flex-col overflow-hidden rounded-xl border bg-(--scribble-panel)">
      <h2 className="flex shrink-0 items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
        <Users
          className="size-4 text-teal-700 dark:text-teal-300"
          aria-hidden
        />
        {active ? "Players" : "Guests"}
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {members.length} online
        </span>
      </h2>
      <ul className="min-h-0 overflow-y-auto overscroll-contain px-2 py-1 text-sm">
        {getRoster(props, false).map((player) => (
          <PlayerRow key={player.id} player={player} players={props} />
        ))}
      </ul>
    </section>
  );
}

export function MobilePlayersButton(props: PlayersProps) {
  const { match, members, hostId } = props;
  const roster = getRoster(props, true);
  const host = roster.find((player) => player.id === hostId);
  const avatars = (
    host ? [host, ...roster.filter((player) => player.id !== hostId)] : roster
  ).slice(0, 3);
  const label = match ? "participants" : "guests";

  return (
    <Sheet>
      <SheetTrigger
        className="flex h-11 max-w-[120px] items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${label}, ${roster.length} total, ${members.length} online${host ? `, ${host.name} is host` : ""}`}
      >
        <AvatarGroup className="shrink-0 -space-x-2" aria-hidden>
          {avatars.map((player) => (
            <span
              key={player.id}
              className="relative rounded-full ring-2 ring-(--scribble-panel)"
            >
              <PlayerAvatar name={player.name} emoji={player.emoji} />
              {player.id === hostId && (
                <Crown className="absolute -top-1 -right-1 z-10 size-3 fill-amber-300 text-amber-700 dark:text-amber-400" />
              )}
            </span>
          ))}
        </AvatarGroup>
        <span className="min-w-0 flex-1 truncate font-medium">
          {roster.length > 3 ? `+${roster.length - 3}` : roster.length}
        </span>
        <ChevronUp
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[min(75dvh,38rem)] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3 pr-12">
          <SheetTitle>{match ? "Players and spectators" : "Guests"}</SheetTitle>
          <SheetDescription>{members.length} online</SheetDescription>
        </SheetHeader>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 text-sm">
          {roster.map((player) => (
            <PlayerRow key={player.id} player={player} players={props} />
          ))}
          {roster.length === 0 && (
            <li className="p-4 text-center text-muted-foreground">
              No one is online yet.
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
