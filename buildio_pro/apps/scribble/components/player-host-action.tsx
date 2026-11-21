"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
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
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { getGameError } from "@/lib/game-error";

export function PlayerHostAction({
  roomCode,
  guest,
}: {
  roomCode: string;
  guest: { id: Id<"users">; name: string };
}) {
  const { userToken } = useUserStore();
  const transferHost = useMutation(api.scribbleRooms.transferHost);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function makeHost() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await transferHost({ roomCode, userToken, targetUserId: guest.id });
      setOpen(false);
      toast.success(`${guest.name} is now the host.`);
    } catch (cause) {
      setError(getGameError(cause, "Could not transfer host. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setError("");
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          aria-label={`Make ${guest.name} host`}
        >
          Make host
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Make {guest.name} the host?</AlertDialogTitle>
          <AlertDialogDescription>
            They’ll be able to start and stop games, change settings, or pass
            the host role to another guest.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button disabled={pending} onClick={() => void makeHost()}>
            {pending ? "Transferring…" : "Transfer host"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
