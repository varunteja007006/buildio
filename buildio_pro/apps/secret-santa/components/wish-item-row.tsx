"use client";

import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ExternalLink, Gift, Trash2 } from "lucide-react";

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
    <li className="flex items-center justify-between gap-2 rounded-xl border bg-accent px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
        >
          {item.item_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.item_image}
              alt=""
              loading="lazy"
              className="size-full rounded-[inherit] object-cover"
            />
          ) : (
            <Gift className="size-5" />
          )}
        </span>
        <span className="truncate">{item.item_text}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {item.item_link && (
          <a
            href={item.item_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80"
            title={item.item_link}
          >
            <ExternalLink className="size-3.5" />
            {linkLabel}
          </a>
        )}
        {onRemove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(item._id)}
                  className="cursor-pointer shrink-0 hover:text-destructive"
                  aria-label="Delete item"
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
    </li>
  );
}
