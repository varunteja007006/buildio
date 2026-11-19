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


interface GameSettingsDialogProps {
  roomCode: string;
  children: React.ReactNode;
}

export function GameSettingsDialog({
  roomCode,
  children,
}: GameSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { userToken } = useUserStore();

  const existingSettings = useQuery(api.scribble.getGameSettings, { roomCode });
  const updateSettings = useMutation(api.scribble.updateGameSettings);

  const [rounds, setRounds] = useState(5);
  const [timer, setTimer] = useState(60);
  const [listOfWords, setListOfWords] = useState("");
  const [wordFilters, setWordFilters] = useState("");

  // Update form when settings load
  useEffect(() => {
    if (existingSettings) {
      setRounds(existingSettings.rounds);
      setTimer(existingSettings.timer);
      setListOfWords(existingSettings.list_of_words.join(", "));
      setWordFilters(existingSettings.word_filters?.join(", ") || "");
    }
  }, [existingSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listOfWords.trim()) {
      toast.error("Please enter at least one word");
      return;
    }

    if (rounds < 1 || rounds > 20) {
      toast.error("Rounds must be between 1 and 20");
      return;
    }

    if (timer < 30 || timer > 300) {
      toast.error("Timer must be between 30 and 300 seconds");
      return;
    }

    try {
      const wordsArray = listOfWords
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);

      const filtersArray = wordFilters
        ? wordFilters
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : undefined;

      await updateSettings({
        roomCode,
        userToken,
        rounds,
        timer,
        list_of_words: wordsArray,
        word_filters: filtersArray,
      });

      toast.success("Game settings saved!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Configure game rounds, timer, and word list for drawing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rounds">Number of Rounds</Label>
            <Input
              id="rounds"
              type="number"
              placeholder="5"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              min={1}
              max={20}
            />
            <p className="text-sm text-muted-foreground">
              Total rounds to play (1-20)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer">Timer (seconds)</Label>
            <Input
              id="timer"
              type="number"
              placeholder="60"
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              min={30}
              max={300}
            />
            <p className="text-sm text-muted-foreground">
              Time per turn in seconds (30-300)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="words">Words to Draw</Label>
            <Textarea
              id="words"
              placeholder="cat, dog, house, tree, sun"
              className="min-h-[100px]"
              value={listOfWords}
              onChange={(e) => setListOfWords(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated words (e.g., cat, dog, house)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filters">Word Filters (Optional)</Label>
            <Input
              id="filters"
              placeholder="animals, nature, objects"
              value={wordFilters}
              onChange={(e) => setWordFilters(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Categories or tags (comma-separated)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
