"use client";

import usePresence from "@convex-dev/presence/react";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";

import { ParticipantCard } from "@/components/participant-card";
import { useUserStore } from "@/lib/store/user.store";

export function Participants() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "unknown-room";

  const { user, userToken } = useUserStore();

  const roomDetails = useQuery(api.rooms.getRoomDetails, {
    userToken,
    roomCode: roomCode as string,
  });

  const presenceState = usePresence(
    api.presence,
    roomCode as string,
    user?.success === true ? user.id : "",
  );

  if (!presenceState) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      {presenceState.map((participant) => (
        <ParticipantCard
          key={participant.userId}
          name={participant.name ?? "Unknown User"}
          online={participant.online}
          lastDisconnected={participant.lastDisconnected}
          emojiId={participant.userId}
          isOwner={roomDetails?.room?.ownerId === participant.userId}
        />
      ))}
      {presenceState.length === 0 && (
        <p className="text-center text-muted-foreground text-sm">
          No participants yet.
        </p>
      )}
    </div>
  );
}
