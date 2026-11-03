"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { useAction } from "convex/react";
import React from "react";

type WishlistItem = {
  _id: Id<"santa_wishlist_items">;
  item_link?: string | null;
  item_image?: string | null;
};

// Fetches og:image thumbnails for wishlist items that have a link but no image
// yet (new items ever-commit; failures are not retried until remount).
export function useLinkPreviews(
  roomCode: string,
  userToken: string,
  items?: WishlistItem[],
) {
  const fetchLinkPreview = useAction(api.linkPreview.fetchLinkPreview);
  const attempted = React.useRef<Set<Id<"santa_wishlist_items">>>(new Set());

  React.useEffect(() => {
    if (!userToken || !items) return;
    for (const item of items) {
      if (!item.item_link || item.item_image) continue;
      if (attempted.current.has(item._id)) continue;
      attempted.current.add(item._id);
      fetchLinkPreview({ roomCode, userToken, itemId: item._id }).catch(
        (error) => {
          console.warn("Link preview fetch failed:", error);
        },
      );
    }
  }, [items, roomCode, userToken, fetchLinkPreview]);
}
