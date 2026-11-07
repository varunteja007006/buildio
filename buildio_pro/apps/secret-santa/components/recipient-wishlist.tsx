"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { useParams } from "next/navigation";

import { WishItemRow } from "@/components/wish-item-row";
import { useLinkPreviews } from "@/hooks/use-link-previews";
import { useUserStore } from "@/lib/store/user.store";

export function RecipientWishlist({
  myRecipientUsername,
}: Readonly<{
  myRecipientUsername?: string;
}>) {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const items = useQuery(
    api.secretSanta.getWishlistOfRecipient,
    userToken && myRecipientUsername
      ? { roomCode: roomCode as string, userToken }
      : "skip",
  );

  useLinkPreviews(roomCode as string, userToken, items);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Eye className="size-5" />
          {myRecipientUsername
            ? `${myRecipientUsername}'s wishlist 🎁`
            : "Recipient's Wishlist"}
        </CardTitle>
        <CardDescription>
          {myRecipientUsername
            ? `Sneak a peek before you shop 🛍️`
            : "Visible once the draw is complete."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!myRecipientUsername ? (
          <p className="text-sm text-muted-foreground">
            You will see this after the draw.
          </p>
        ) : items && items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <WishItemRow key={item._id} item={item} linkLabel="View" />
            ))}
          </ul>
        ) : items && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No wishlist items yet. Time for some detective work! 🔍
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Loading wishlist… ⏳</p>
        )}
      </CardContent>
    </Card>
  );
}
