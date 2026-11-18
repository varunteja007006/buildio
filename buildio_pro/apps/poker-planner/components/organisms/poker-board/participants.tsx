import usePresence from "@convex-dev/presence/react";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";

import { useUserStore } from "@/lib/store/user.store";

import { ParticipantCard } from "./participant-card";
import { ConfettiSideCanonsNotifier } from "./reaction-collection";

const findUserStoryPoint = (
  userId: string,
  list: {
    userId: string;
    isCurrentUser: boolean;
    storyPoint: string | number | undefined;
  }[],
) => {
  return list.find((item) => item.userId === userId);
};

export function Participants({
  storyId,
}: Readonly<{
  storyId: Id<"stories"> | null;
}>) {
  const params = useParams();
  const roomCode = params?.roomCode ?? "unknown-room";

  const { user, userToken } = useUserStore();
  const userId = user?.success === true ? user.id : undefined;

  const presenceState = usePresence(
    api.presence,
    roomCode as string,
    userId ?? "",
  );

  const roomStoryPoints = useQuery(
    api.storyPoints.getStoryPoints,
    storyId && userToken ? { storyId, token: userToken } : "skip",
  );

  const updatedRoomStoryPoints = React.useMemo(
    () =>
      roomStoryPoints?.success && roomStoryPoints.storyPoints
        ? roomStoryPoints.storyPoints.map((item) => ({
            userId: item.userId,
            isCurrentUser: item.isCurrentUser,
            storyPoint: item.story_point,
          }))
        : [],
    [roomStoryPoints],
  );

  type Participant = NonNullable<typeof presenceState>[number] & {
    emoji?: string;
    isCurrentUser?: boolean;
    hasVoted: boolean;
  };

  const participantList = React.useMemo<Participant[]>(
    () =>
      presenceState?.map((p) => {
        const foundUser = findUserStoryPoint(p.userId, updatedRoomStoryPoints);
        return {
          ...p,
          isCurrentUser: foundUser?.isCurrentUser,
          hasVoted: !!foundUser?.userId,
        };
      }) ?? [],
    [presenceState, updatedRoomStoryPoints],
  );

  if (!presenceState) {
    return null;
  }

  return (
    <div className="space-y-2">
      {participantList.map((innerUser) => {
        return (
          <ParticipantCard
            key={innerUser.userId}
            name={innerUser.name ?? "Unknown User"}
            online={innerUser.online}
            hasVoted={innerUser?.hasVoted}
            lastDisconnected={innerUser.lastDisconnected}
            emojiId={innerUser.userId}
            emoji={innerUser.emoji}
            isUser={innerUser.userId === userId}
          />
        );
      })}
      <ConfettiSideCanonsNotifier />
    </div>
  );
}
