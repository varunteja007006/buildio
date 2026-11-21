"use client";

import { CopyBtn } from "@workspace/game-ui/components/atoms/copy-btn";
import { ShareBtn } from "@workspace/game-ui/components/atoms/share-btn";
import { LogoutBtn } from "@workspace/game-ui/components/logout-btn";
import { ModeToggle } from "@workspace/game-ui/components/mode-toggle";
import { UserCard } from "@workspace/game-ui/components/user-card";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { useMutation } from "convex/react";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ScribbleState } from "@/components/game-room";
import { GameSettingsDialog } from "@/components/game-settings-dialog";
import { Navbar } from "@/components/navbar";
import { getGameError } from "@/lib/game-error";

type RoomHeaderProps = {
  state: ScribbleState;
};

export function RoomHeader(props: RoomHeaderProps) {
  const { roomCode, roomName } = props.state;
  return (
    <header className="hidden shrink-0 rounded-xl border bg-(--scribble-panel) px-3 py-2 lg:block">
      <Navbar
        roomDetails={
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 border-l pl-3">
            <h1
              className="min-w-0 truncate text-sm font-semibold"
              title={roomName}
            >
              {roomName}
            </h1>
            <RoomCode roomCode={roomCode} />
          </div>
        }
        roomActions={<RoomActions {...props} />}
      />
    </header>
  );
}

export function MobileRoomMenu(props: RoomHeaderProps) {
  const { roomCode, roomName } = props.state;
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 lg:hidden"
          aria-label="Room options"
        >
          <Ellipsis className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh] gap-0 rounded-t-xl">
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle className="wrap-break-word">{roomName}</SheetTitle>
          <SheetDescription>Room options</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Room code</span>
            <RoomCode roomCode={roomCode} />
          </div>
          <RoomActions {...props} onStop={() => setOpen(false)} />
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <UserCard roomNoun="Scribble room" />
            <ModeToggle />
            <LogoutBtn />
            <Button asChild variant="outline" size="sm">
              <Link href="/rooms">Back to rooms</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RoomCode({ roomCode }: { roomCode: string }) {
  return (
    <CopyBtn
      text={roomCode}
      size="xs"
      variant="ghost"
      aria-label={`Copy room code ${roomCode}`}
      tooltipText="Copy room code"
    >
      <span className="font-mono text-muted-foreground">{roomCode}</span>
    </CopyBtn>
  );
}

function RoomActions({
  state,
  onStop,
}: RoomHeaderProps & { onStop?: () => void }) {
  const { userToken } = useUserStore();
  const { roomCode, match } = state;
  const stop = useMutation(api.scribbleMatch.stop);
  const [stopTarget, setStopTarget] =
    useState<NonNullable<ScribbleState["match"]>["id"]>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const active = match && match.phase !== "finished";
  const confirmStop = Boolean(active && stopTarget === match.id);

  async function handleStop() {
    if (pending || !stopTarget) return;
    setPending(true);
    setError("");
    try {
      await stop({ roomCode, userToken, id: stopTarget });
      setStopTarget(undefined);
      onStop?.();
    } catch (cause) {
      setError(getGameError(cause, "Could not stop the game. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <ShareBtn
          size="sm"
          variant="outline"
          aria-label="Invite players by copying the room link"
        >
          Invite
        </ShareBtn>
        {state.isHost &&
          (active ? (
            <AlertDialog
              open={confirmStop}
              onOpenChange={(open) => {
                if (!pending) {
                  setError("");
                  setStopTarget(open ? match.id : undefined);
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Stop game
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop this game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The game will end and everyone will see the scores so far.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>
                    Keep playing
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => void handleStop()}
                  >
                    {pending ? "Stopping…" : "Stop and show scores"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <GameSettingsDialog roomCode={roomCode}>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                disabled={pending}
              >
                Settings
              </Button>
            </GameSettingsDialog>
          ))}
      </div>
      {error && !confirmStop && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
