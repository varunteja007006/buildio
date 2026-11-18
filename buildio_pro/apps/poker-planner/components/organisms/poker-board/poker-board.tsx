"use client";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { useJoinRoom } from "@/hooks/useJoinRoom";
import { useUserStore } from "@/lib/store/user.store";

import { Participants } from "./participants";
import { PokerBoardHeader } from "./poker-board-header";
import { PokerCards } from "./poker-card";
import { PokerResults } from "./poker-results";

export function PokerBoard() {
  const params = useParams();
  const roomCode = (params?.roomCode as string) ?? "";

  const { userToken, user } = useUserStore();
  const { joinRoom } = useJoinRoom();
  const [storyId, setStoryId] = React.useState<Id<"stories"> | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = React.useState(0);

  const startedStory = useQuery(api.stories.getStartedStory, {
    userToken,
    roomCode: roomCode as string,
  });

  const prevStartedStoryRef = React.useRef<typeof startedStory>(undefined);

  const createMutation = useMutation(api.stories.createStory);
  const completeMutation = useMutation(api.stories.completeStory);

  React.useEffect(() => {
    if (
      startedStory !== undefined &&
      prevStartedStoryRef.current !== undefined
    ) {
      const prevActive =
        prevStartedStoryRef.current?.success &&
        !!prevStartedStoryRef.current?.story;
      const currentActive = startedStory.success && !!startedStory.story;
      if (prevActive !== currentActive) {
        if (currentActive) {
          toast.success("Game started!");
        } else {
          toast.success("Game completed!");
        }
      }
    }
    if (startedStory?.success && startedStory.story) {
      setStoryId(startedStory.story._id);
    } else {
      setStoryId(null);
    }
    prevStartedStoryRef.current = startedStory;
  }, [startedStory]);

  React.useEffect(() => {
    const endsAt = startedStory?.cooldownEndsAt ?? 0;
    if (!endsAt) {
      setCooldownRemainingMs(0);
      return;
    }
    // Measure the room's cooldown against the server clock, so a skewed local
    // clock cannot re-enable "Start" early or leave it disabled too long.
    const clockOffset = (startedStory?.serverNow ?? Date.now()) - Date.now();
    const tick = () => {
      const remaining = Math.max(0, endsAt - (Date.now() + clockOffset));
      setCooldownRemainingMs(remaining);
      return remaining;
    };
    if (tick() <= 0) return;
    const id = window.setInterval(() => {
      if (tick() <= 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedStory]);

  React.useEffect(() => {
    if (roomCode) {
      joinRoom(roomCode);
    }
  }, [roomCode, joinRoom]);

  const handleClick = async () => {
    if (!userToken || !roomCode || startedStory === undefined) return;

    if (startedStory?.success && startedStory.story) {
      // Stop the story, then start the room's cooldown right away so the
      // button can't be clicked again before the server round-trip lands.
      const result = await completeMutation({
        storyId: startedStory.story._id,
        userToken,
      });
      if (result.success) setCooldownRemainingMs(10_000);
      setStoryId(null);
    } else {
      // Start a new story
      const result = await createMutation({
        roomCode: roomCode as string,
        userToken,
      });
      if (result.success && result.storyId) {
        setStoryId(result.storyId);
      } else if (!result.success) {
        toast.error(result.message);
      }
    }
  };

  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);

  let hasActiveStory = null;
  let buttonText = "Loading...";
  if (startedStory !== undefined) {
    hasActiveStory = startedStory.success && startedStory.story;
    buttonText = hasActiveStory
      ? "Stop"
      : cooldownSeconds > 0
        ? `Start (${cooldownSeconds}s)`
        : "Start";
  }
  const isDisabled =
    !userToken ||
    !roomCode ||
    startedStory === undefined ||
    (!hasActiveStory && cooldownSeconds > 0);

  if (!user?.id) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4 md:flex-row px-4 py-2">
      <div className="flex flex-col w-full gap-4">
        <PokerBoardHeader />

        <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] gap-10 bg-card rounded-md border">
          <button
            onClick={handleClick}
            disabled={isDisabled}
            className="bg-white dark:bg-secondary dark:border-primary/50 shadow font-bold border hover:shadow-lg text-primary hover:dark:border-primary hover:bg-primary-foreground/80 h-[50px] w-[140px] cursor-pointer rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonText}
          </button>

          <PokerCards storyId={storyId} />
        </div>

        <PokerResults storyId={storyId} />
      </div>

      <div className="w-xs">
        <Participants storyId={storyId} />
      </div>
    </div>
  );
}
