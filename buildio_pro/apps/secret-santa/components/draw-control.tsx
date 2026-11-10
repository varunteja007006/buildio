"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { Gift, PiggyBank, RotateCcw, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/convex-errors";
import { useUserStore } from "@/lib/store/user.store";
import { MAX_BUDGET_VALUE } from "@/lib/utils";

export function DrawControl({
  status,
  pendingParticipants,
  minBudget,
  maxBudget,
}: Readonly<{
  status: "lobby" | "drawn";
  pendingParticipants: number;
  minBudget?: number;
  maxBudget?: number;
}>) {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const runDraw = useMutation(api.secretSanta.runDraw);
  const resetDraw = useMutation(api.secretSanta.resetDraw);
  const setBudget = useMutation(api.secretSanta.setBudget);

  // Local string state so the inputs stay editable back and forth; the
  // effects tile them with whatever gameState is streaming right now.
  const [minInput, setMinInput] = useState(
    minBudget === undefined ? "" : String(minBudget),
  );
  const [maxInput, setMaxInput] = useState(
    maxBudget === undefined ? "" : String(maxBudget),
  );
  useEffect(() => {
    setMinInput(minBudget === undefined ? "" : String(minBudget));
  }, [minBudget]);
  useEffect(() => {
    setMaxInput(maxBudget === undefined ? "" : String(maxBudget));
  }, [maxBudget]);

  const handleRunDraw = async () => {
    try {
      const result = await runDraw({
        roomCode: roomCode as string,
        userToken,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to run the draw"));
      console.error(error);
    }
  };

  const handleResetDraw = async () => {
    try {
      await resetDraw({ roomCode: roomCode as string, userToken });
      toast.success("Draw reset. Back to the lobby 🎄");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reset the draw"));
      console.error(error);
    }
  };

  const handleSaveBudget = async () => {
    // Cheap client-side pre-validation: Empty inputs count as 0 so clearing
    // still works; the server keeps its own validation as the backstop.
    const minBudget = Number(minInput) || 0;
    const maxBudget = Number(maxInput) || 0;
    for (const value of [minBudget, maxBudget]) {
      if (value < 0 || !Number.isFinite(value)) {
        toast.error("Budget values can't be negative");
        return;
      }
      if (value > MAX_BUDGET_VALUE) {
        toast.error("Budget values are capped at 100,000,000");
        return;
      }
    }
    if (minBudget > maxBudget) {
      toast.error("Minimum budget can't be higher than the maximum");
      return;
    }
    try {
      await setBudget({
        roomCode: roomCode as string,
        userToken,
        minBudget,
        maxBudget,
      });
      toast.success("Gift budget saved 🎁");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save the budget"));
      console.error(error);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Gift className="size-5" />
          Host corner
        </CardTitle>
        <CardDescription>
          {status === "drawn"
            ? pendingParticipants > 0
              ? `${pendingParticipants} new ${
                  pendingParticipants === 1
                    ? "participant"
                    : "participants"
                } joined since the draw 🎲 redraw to match them in!`
              : "Snow is settled ⛄️ Redraw unlocks when someone new joins; Reset reshuffles instead."
            : "Everyone here? Time to shuffle the names! Everyone gets a secret recipient (never themselves 🤝)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          onClick={handleRunDraw}
          disabled={status === "drawn" && pendingParticipants === 0}
          className="cursor-pointer"
        >
          <Sparkles className="size-4" />
          {status === "drawn" ? "Redraw" : "Run the draw"}
        </Button>
        {status === "drawn" && (
          <Button
            variant="outline"
            onClick={handleResetDraw}
            className="cursor-pointer"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        )}
      </CardContent>
      <CardContent className="flex flex-wrap items-end gap-2 border-t border-primary/10 pt-4">
        <div className="w-28 space-y-1">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum gift budget"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
          />
        </div>
        <div className="w-28 space-y-1">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum gift budget"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSaveBudget}
          className="cursor-pointer"
        >
          <PiggyBank className="size-4" />
          Save budget
        </Button>
      </CardContent>
    </Card>
  );
}
