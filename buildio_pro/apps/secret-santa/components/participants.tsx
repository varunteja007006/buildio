"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useQuery } from "convex/react";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";

import { ParticipantCard } from "@/components/participant-card";
import { useUserStore } from "@/lib/store/user.store";

export function Participants() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const gameState = useQuery(
    api.secretSanta.getGameState,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );

  const participants = gameState?.participants ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="size-5" />
          Participants
          <span className="text-muted-foreground text-sm font-normal">
            ({participants.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No participants yet.</p>
        ) : (
          participants.map((participant) => (
            <ParticipantCard
              key={participant.user_id}
              name={participant.username}
              emojiId={participant.user_id}
              isOwner={participant.is_owner}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
