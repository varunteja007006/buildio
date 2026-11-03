"use client";

import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { ExternalLink, ListX } from "lucide-react";

type WishItem = {
  _id: Id<"santa_wishlist_items">;
  item_text: string;
  item_link?: string | null;
  item_image?: string | null;
};

export function WishItemRow({
  item,
  linkLabel,
  onRemove,
}: Readonly<{
  item: WishItem;
  linkLabel: string;
  onRemove?: (itemId: Id<"santa_wishlist_items">) => void;
}>) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border bg-accent px-2 py-1.5">
      <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
        {item.item_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.item_image}
            alt=""
            loading="lazy"
            className="size-10 shrink-0 rounded-md border object-cover"
          />
        )}
        <span className="truncate">{item.item_text}</span>
        {item.item_link && (
          <a
            href={item.item_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80"
            title={item.item_link}
          >
            <ExternalLink className="size-3.5" />
            {linkLabel}
          </a>
        )}
      </span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item._id)}
          className="cursor-pointer shrink-0"
          aria-label="Remove item"
        >
          <ListX />
        </Button>
      )}
    </li>
  );
}
