"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useMutation, useQuery } from "convex/react";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { ParticipantCard } from "@/components/participant-card";
import { getErrorMessage } from "@/lib/convex-errors";
import { useUserStore } from "@/lib/store/user.store";

export function Participants() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { user, userToken } = useUserStore();

  const gameState = useQuery(
    api.secretSanta.getGameState,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );

  const participants = gameState?.participants ?? [];
  const isViewerOwner = gameState?.room?.ownerId === user?.id;

  const kickParticipant = useMutation(api.secretSanta.kickParticipant);

  const handleKick = async (userId: Id<"users">, username: string) => {
    const isDrawn = gameState?.status === "drawn";
    const drawnWarning = isDrawn
      ? " The draw will be reset — everyone will need a new match."
      : "";
    if (!window.confirm(`Kick ${username}?${drawnWarning}`)) return;

    try {
      const result = await kickParticipant({
        roomCode: roomCode as string,
        userToken,
        targetUserId: userId,
      });
      if (result.draw_reset) {
        toast.success(
          `${username} was kicked. The draw was reset — run it again 🎁`,
        );
      } else {
        toast.success(`${username} was kicked`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to kick the participant"));
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="size-5" />
          Around the tree
          <span className="text-muted-foreground text-sm font-normal">
            ({participants.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nobody yet — share the room code! 👋
          </p>
        ) : (
          participants.map((participant) => (
            <ParticipantCard
              key={participant.user_id}
              name={participant.username}
              emojiId={participant.user_id}
              isOwner={participant.is_owner}
              onKick={
                isViewerOwner && !participant.is_owner
                  ? () => handleKick(participant.user_id, participant.username)
                  : undefined
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
