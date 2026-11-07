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
import { getErrorMessage } from "@/lib/convex-errors";
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
      toast.error(getErrorMessage(error, "Failed to add item"));
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
      toast.error(getErrorMessage(error, "Failed to remove item"));
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">My Wishlist 📝</CardTitle>
        <CardDescription>
          Gift ideas for your Santa to sniff out. Only you two can see this
          list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd}>
          <div className="overflow-hidden rounded-xl border shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <div className="flex items-center">
              <label
                htmlFor="wish-item"
                className="w-24 shrink-0 border-r border-input px-3 text-sm text-muted-foreground"
              >
                Name
              </label>
              <Input
                id="wish-item"
                placeholder="Eg: A cozy blanket"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                maxLength={200}
                disabled={isAdding}
                className="rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <div className="flex items-center border-t border-input">
              <label
                htmlFor="wish-link"
                className="w-24 shrink-0 border-r border-input px-3 text-sm text-muted-foreground"
              >
                Link
              </label>
              <Input
                id="wish-link"
                type="url"
                placeholder="Optional — eg: https://www.amazon.in/..."
                value={itemLink}
                onChange={(e) => setItemLink(e.target.value)}
                maxLength={500}
                disabled={isAdding}
                className="rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={isAdding || !itemText.trim()}
              className="w-full cursor-pointer rounded-none border-t"
            >
              <ListPlus />
              Add to wishlist
            </Button>
          </div>
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
            Nothing here yet — drop your first wish! 🌟
          </p>
        )}
      </CardContent>
    </Card>
  );
}
