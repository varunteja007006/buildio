"use client";

import { getErrorMessage } from "@workspace/game-ui/lib/convex-errors";
import { useUserStore } from "@workspace/game-ui/lib/store/user.store";
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
import { useState } from "react";
import { toast } from "sonner";

import { ParticipantCard } from "@/components/participant-card";

export function Participants() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { user, userToken } = useUserStore();

  const gameState = useQuery(
    api.secretSanta.getGameState,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );

  const participants = gameState?.participants ?? [];
  const hostId = gameState?.room?.hostId;
  const isViewerHost = user?.success === true && hostId === user.id;

  const kickParticipant = useMutation(api.secretSanta.kickParticipant);
  const transferHost = useMutation(api.secretSanta.transferHost);
  const [transferring, setTransferring] = useState(false);

  const handleTransfer = async (userId: Id<"users">, username: string) => {
    if (
      transferring ||
      !window.confirm(
        `Make ${username} the host? They’ll manage the draw, gift budget, and participants.`,
      )
    )
      return;

    setTransferring(true);
    try {
      await transferHost({
        roomCode: roomCode as string,
        userToken,
        targetUserId: userId,
      });
      toast.success(`${username} is now the host`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to transfer the host role"));
    } finally {
      setTransferring(false);
    }
  };

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
          participants.map((participant) => {
            const isHost = participant.user_id === hostId;
            const canManage = isViewerHost && !isHost;
            return (
              <ParticipantCard
                key={participant.user_id}
                name={participant.username}
                emojiId={participant.user_id}
                isHost={isHost}
                actionsDisabled={transferring}
                onTransferHost={
                  canManage
                    ? () =>
                        handleTransfer(
                          participant.user_id,
                          participant.username,
                        )
                    : undefined
                }
                onKick={
                  canManage && !participant.is_owner
                    ? () =>
                        handleKick(participant.user_id, participant.username)
                    : undefined
                }
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
