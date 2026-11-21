"use client";

import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getGameError } from "@/lib/game-error";

interface GameSettingsDialogProps {
  roomCode: string;
  children: React.ReactNode;
}

const DEFAULT_ROUNDS = "1";
const DEFAULT_TIMER = "120";

export function GameSettingsDialog({
  roomCode,
  children,
}: GameSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [timer, setTimer] = useState(DEFAULT_TIMER);
  const [listOfWords, setListOfWords] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { userToken } = useUserStore();
  const settingsArgs = open && userToken ? { roomCode, userToken } : "skip";
  const existingSettings = useQuery(api.scribble.getGameSettings, settingsArgs);
  const updateSettings = useMutation(api.scribble.updateGameSettings);

  useEffect(() => {
    if (!open) return;
    setRounds(DEFAULT_ROUNDS);
    setTimer(DEFAULT_TIMER);
    setListOfWords("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open || !existingSettings) return;
    setRounds(String(existingSettings.rounds));
    setTimer(String(existingSettings.timer));
    setListOfWords(existingSettings.list_of_words.join(", "));
  }, [existingSettings, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const phrases = listOfWords
      .split(/[\n,]/)
      .map((phrase) => phrase.trim())
      .filter(Boolean);
    const roundCount = Number(rounds);
    const turnSeconds = Number(timer);

    if (!Number.isInteger(roundCount) || roundCount < 1 || roundCount > 20) {
      setError("Rounds must be a whole number from 1 to 20.");
      return;
    }
    if (
      !Number.isInteger(turnSeconds) ||
      turnSeconds < 30 ||
      turnSeconds > 300
    ) {
      setError("Timer must be a whole number from 30 to 300 seconds.");
      return;
    }
    if (phrases.length > 100) {
      setError("Enter no more than 100 phrases.");
      return;
    }
    if (phrases.some((phrase) => phrase.length > 64)) {
      setError("Each phrase must be 64 characters or fewer.");
      return;
    }
    if (!userToken) {
      setError(
        "Your player session is unavailable. Rejoin the room and try again.",
      );
      return;
    }

    setPending(true);
    try {
      await updateSettings({
        roomCode,
        userToken,
        rounds: roundCount,
        timer: turnSeconds,
        list_of_words: phrases,
      });
      toast.success("Game settings saved!");
      setOpen(false);
    } catch (submitError) {
      setError(
        getGameError(submitError, "Could not save settings. Try again."),
      );
    } finally {
      setPending(false);
    }
  };

  const loadingSettings =
    open && Boolean(userToken) && existingSettings === undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Choose the number of rounds, turn timer, and optional custom drawing
            phrases.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          <div className="min-h-0 space-y-4 overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="rounds">Number of Rounds</Label>
              <Input
                id="rounds"
                type="number"
                step="1"
                inputMode="numeric"
                value={rounds}
                onChange={(event) => setRounds(event.target.value)}
                min={1}
                max={20}
                disabled={loadingSettings || pending}
              />
              <p className="text-sm text-muted-foreground">
                Each player draws once per round. Choose 1–20 rounds.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timer">Timer (seconds)</Label>
              <Input
                id="timer"
                type="number"
                step="1"
                inputMode="numeric"
                value={timer}
                onChange={(event) => setTimer(event.target.value)}
                min={30}
                max={300}
                disabled={loadingSettings || pending}
              />
              <p className="text-sm text-muted-foreground">
                30–300 seconds per turn.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="words">Custom Drawing Phrases (Optional)</Label>
              <Textarea
                id="words"
                placeholder="cat, tree house, sunset"
                className="min-h-[100px]"
                value={listOfWords}
                onChange={(event) => setListOfWords(event.target.value)}
                disabled={loadingSettings || pending}
              />
              <p className="text-sm text-muted-foreground">
                Separate phrases with commas or new lines. Up to 100 phrases, 64
                characters each. Leave empty to use the default word list.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {loadingSettings && (
              <p role="status" className="text-sm text-muted-foreground">
                Loading settings…
              </p>
            )}
            {!userToken && open && (
              <p role="alert" className="text-sm text-destructive">
                Player session unavailable.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loadingSettings || pending || !userToken}
            >
              {pending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
