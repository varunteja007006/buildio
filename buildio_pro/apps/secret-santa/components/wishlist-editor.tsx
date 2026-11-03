"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useMutation, useQuery } from "convex/react";
import { ListPlus } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { WishItemRow } from "@/components/wish-item-row";
import { useLinkPreviews } from "@/hooks/use-link-previews";
import { useUserStore } from "@/lib/store/user.store";

export function WishlistEditor() {
  const params = useParams();
  const roomCode = params?.roomCode ?? "";
  const { userToken } = useUserStore();

  const [itemText, setItemText] = React.useState("");
  const [itemLink, setItemLink] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const items = useQuery(
    api.secretSanta.getMyWishlist,
    userToken ? { roomCode: roomCode as string, userToken } : "skip",
  );
  const addWishItem = useMutation(api.secretSanta.addWishItem);
  const removeWishItem = useMutation(api.secretSanta.removeWishItem);

  useLinkPreviews(roomCode as string, userToken, items);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemText.trim()) return;

    setIsAdding(true);
    try {
      await addWishItem({
        roomCode: roomCode as string,
        userToken,
        itemText,
        itemLink: itemLink.trim() || undefined,
      });
      setItemText("");
      setItemLink("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add item";
      toast.error(message);
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (itemId: Id<"santa_wishlist_items">) => {
    try {
      await removeWishItem({
        roomCode: roomCode as string,
        userToken,
        itemId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove item";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">My Wishlist 📝</CardTitle>
        <CardDescription>
          Add gift ideas. Only you and your Secret Santa can see this list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Eg: A cozy blanket"
              value={itemText}
              onChange={(e) => setItemText(e.target.value)}
              maxLength={200}
              disabled={isAdding}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isAdding || !itemText.trim()}
              className="cursor-pointer"
            >
              <ListPlus />
            </Button>
          </div>
          <Input
            type="url"
            placeholder="Product link (optional) — eg: https://www.amazon.in/..."
            value={itemLink}
            onChange={(e) => setItemLink(e.target.value)}
            maxLength={500}
            disabled={isAdding}
          />
        </form>

        {items && items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <WishItemRow
                key={item._id}
                item={item}
                linkLabel="Link"
                onRemove={handleRemove}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No items yet. Add your first wish!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
