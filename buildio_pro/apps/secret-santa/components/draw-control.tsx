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
import { useMutation } from "convex/react";
import { Gift, RotateCcw, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { useUserStore } from "@/lib/store/user.store";

export function DrawControl({
  status,
}: Readonly<{
  status: "lobby" | "drawn";
}>) {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const runDraw = useMutation(api.secretSanta.runDraw);
  const resetDraw = useMutation(api.secretSanta.resetDraw);

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
      const message =
        error instanceof Error ? error.message : "Failed to run the draw";
      toast.error(message);
      console.error(error);
    }
  };

  const handleResetDraw = async () => {
    try {
      await resetDraw({ roomCode: roomCode as string, userToken });
      toast.success("Draw reset. Back to the lobby 🎄");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset the draw";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Gift className="size-5" />
          Host Controls
        </CardTitle>
        <CardDescription>
          {status === "drawn"
            ? "The draw is done. You can redraw or reset back to the lobby."
            : "Run the draw once everyone has joined. Everyone gets a recipient (never themselves!)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={handleRunDraw} className="cursor-pointer">
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
    </Card>
  );
}
