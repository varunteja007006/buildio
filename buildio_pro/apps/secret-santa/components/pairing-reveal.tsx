"use client";

import { getErrorMessage } from "@workspace/game-ui/lib/convex-errors";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";

type GameState = FunctionReturnType<typeof api.secretSanta.getGameState>;

export function PairingReveal({
  roomCode,
  userToken,
  reveal,
  participants,
}: Readonly<{
  roomCode: string;
  userToken: string;
  reveal: NonNullable<GameState["reveal"]>;
  participants: GameState["participants"];
}>) {
  const setConsent = useMutation(api.secretSanta.setRevealConsent);
  const [saving, setSaving] = useState(false);
  const { assignmentId, version, approved, allMatched, pairings } = reveal;

  async function toggleConsent() {
    if (!assignmentId || saving) return;
    setSaving(true);
    try {
      await setConsent({
        roomCode,
        userToken,
        assignmentId,
        version,
        approved: !approved,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update your approval"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">
          Share pairings with the host
        </CardTitle>
        <CardDescription>
          The host can see every pairing once everyone agrees. Withdrawing
          approval hides the list again, but the host may already have seen it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p role="status" className="text-sm text-muted-foreground">
          {allMatched
            ? `${reveal.approvedCount} of ${reveal.participantCount} agreed`
            : "Everyone needs a match before the pairings can be shared."}
        </p>
        {assignmentId && (allMatched || approved) && (
          <Button
            variant={approved ? "outline" : "default"}
            size="sm"
            onClick={toggleConsent}
            disabled={saving}
          >
            {approved ? "Withdraw approval" : "Agree to share"}
          </Button>
        )}
        {pairings && (
          <PairingsTable pairings={pairings} participants={participants} />
        )}
      </CardContent>
    </Card>
  );
}

function PairingsTable({
  pairings,
  participants,
}: {
  pairings: NonNullable<NonNullable<GameState["reveal"]>["pairings"]>;
  participants: GameState["participants"];
}) {
  const names = new Map(
    participants.map(({ user_id, username }) => [user_id, username]),
  );

  return (
    <Table aria-label="Secret Santa pairings">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Santa</TableHead>
          <TableHead scope="col">Recipient</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pairings.map(({ santaId, recipientId }) => (
          <TableRow key={santaId}>
            <TableCell className="whitespace-normal break-all">
              {names.get(santaId)}
            </TableCell>
            <TableCell className="whitespace-normal break-all">
              {names.get(recipientId)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
