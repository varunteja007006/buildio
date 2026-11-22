import usePresence from "@convex-dev/presence/react";
import { ParticipantCard } from "@workspace/game-ui/components/participant-card";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
import type { Role } from "@workspace/game-ui/lib/validators";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";

import { FireworksNotifier } from "./fireworks";
import { ReactionsMenu } from "./participant-card";
import { ConfettiSideCanonsNotifier } from "./reaction-collection";

export function Participants({
  storyId,
  ownerId,
}: Readonly<{
  storyId: Id<"stories"> | null;
  ownerId?: string;
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

  const voters = React.useMemo(
    () =>
      new Set<string>(roomStoryPoints?.storyPoints?.map((vote) => vote.userId)),
    [roomStoryPoints],
  );

  type Participant = NonNullable<typeof presenceState>[number] & {
    emoji?: string;
    role?: string;
    hasVoted: boolean;
  };
  const participantList = React.useMemo<Participant[]>(
    () =>
      presenceState?.map((p) => ({ ...p, hasVoted: voters.has(p.userId) })) ??
      [],
    [presenceState, voters],
  );

  if (!presenceState) {
    return null;
  }

  return (
    <div className="space-y-2">
      {participantList.map((innerUser, index) => {
        return (
          <ParticipantCard
            key={innerUser.userId}
            name={innerUser.name ?? "Unknown User"}
            online={innerUser.online}
            hasVoted={innerUser?.hasVoted}
            lastDisconnected={innerUser.lastDisconnected}
            emojiId={innerUser.userId}
            emoji={innerUser.emoji}
            role={innerUser.role as Role | undefined}
            isUser={innerUser.userId === userId}
            isOwner={innerUser.userId === ownerId}
            index={index}
            actions={
              innerUser.userId === userId ? <ReactionsMenu /> : undefined
            }
          />
        );
      })}
      <ConfettiSideCanonsNotifier />
      <FireworksNotifier />
    </div>
  );
}
