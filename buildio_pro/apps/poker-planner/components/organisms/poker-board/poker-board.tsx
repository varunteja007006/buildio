"use client";
import { useJoinRoom } from "@workspace/game-ui/hooks/use-join-room";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { StartStopButton } from "@workspace/ui/components/start-stop-button";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

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
    roomCode,
  });
  const roomDetails = useQuery(
    api.rooms.getRoomDetails,
    userToken && roomCode ? { userToken, roomCode } : "skip",
  );
  const room = roomDetails?.room;
  const isHost = user?.success === true && user.id === room?.ownerId;

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
    if (!userToken || !room || startedStory === undefined) return;

    if (startedStory?.success && startedStory.story) {
      if (!isHost) return;
      // Stop the story, then start the room's cooldown right away so the
      // button can't be clicked again before the server round-trip lands.
      const result = await completeMutation({
        storyId: startedStory.story._id,
        userToken,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setCooldownRemainingMs(10_000);
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

  const hasActiveStory =
    startedStory !== undefined && startedStory.success && !!startedStory.story;
  const isDisabled =
    !userToken ||
    !room ||
    startedStory === undefined ||
    (hasActiveStory && !isHost);

  if (user?.success !== true) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4 md:flex-row px-4 py-2">
      <div className="flex flex-col w-full gap-4">
        <PokerBoardHeader roomName={room?.room_name} />

        <div
          className="flex-1 flex flex-col items-center py-4 justify-center min-h-[40rem] gap-10 bg-card rounded-md shadow-lg border-gray-300 border animate-in fade-in slide-in-from-bottom duration-700 ease-out"
          style={{ animationDelay: "250ms", animationFillMode: "backwards" }}
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-16 duration-500 ease-out"
            style={{ animationDelay: "950ms", animationFillMode: "backwards" }}
          >
            <StartStopButton
              active={hasActiveStory}
              disabled={isDisabled || (!hasActiveStory && cooldownSeconds > 0)}
              className="h-[50px] w-[140px] cursor-pointer"
              stopLabel="Reveal votes"
              startLabel={
                cooldownSeconds > 0 ? `Start (${cooldownSeconds}s)` : "Start"
              }
              onClick={handleClick}
            />
            {hasActiveStory && !isHost && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                The host reveals the votes.
              </p>
            )}
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-16 duration-500 ease-out"
            style={{ animationDelay: "1070ms", animationFillMode: "backwards" }}
          >
            <PokerCards key={storyId ?? "idle"} storyId={storyId} />
          </div>

          <div
            className="w-full min-w-0 max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-500 ease-out motion-reduce:animate-none"
            style={{ animationDelay: "1190ms", animationFillMode: "backwards" }}
          >
            <PokerResults key={storyId ?? roomCode} storyId={storyId} />
          </div>
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span>
            <span aria-hidden="true">👑</span> Host
          </span>
          <span>
            <span aria-hidden="true">👍</span> Voted
          </span>
        </div>
      </div>

      <div className="sm:w-xs">
        <Participants storyId={storyId} ownerId={room?.ownerId} />
      </div>
    </div>
  );
}
