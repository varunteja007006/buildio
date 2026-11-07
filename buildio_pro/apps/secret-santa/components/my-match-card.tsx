"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Gift, Snowflake } from "lucide-react";

export function MyMatchCard({
  status,
  myRecipientUsername,
}: Readonly<{
  status: "lobby" | "drawn";
  myRecipientUsername?: string;
}>) {
  const isDrawn = status === "drawn";

  return (
    <Card className="border-red-300/50 bg-gradient-to-br from-red-50 to-green-50 dark:border-primary/30 dark:from-red-950/40 dark:to-green-950/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Gift className="size-5" />
          My match 🎁
        </CardTitle>
        <CardDescription>
          Only you can see who you&apos;re gifting 🤫
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isDrawn && myRecipientUsername ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              You&apos;re the Secret Santa for
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="rounded-full px-4 py-1 text-lg font-bold capitalize"
              >
                🎁 {myRecipientUsername}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Check their wishlist below before you shop!
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Snowflake className="size-4" />
            <p>
              {isDrawn
                ? "Waiting for your match… ❄️"
                : "The draw hasn't happened yet — nudge the host! ✨"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
