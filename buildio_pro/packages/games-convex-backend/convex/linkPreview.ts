import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRoomMember } from "./secretSanta";

// Fetches a wishlist item's product page and caches its og:image thumbnail.
// DB access lives in the internal query/mutation; the action only fetches.

const MAX_IMAGE_LENGTH = 500;
const PAGE_CHAR_LIMIT = 200_000;

// Authorizes the caller (room member + item owner) and returns the link to
// preview, or null when there is nothing to do (no link, image cached, or
// non-http(s) link).
export const getPreviewTarget = internalQuery({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    itemId: v.id("santa_wishlist_items"),
  },
  returns: v.union(v.null(), v.object({ itemLink: v.string() })),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );

    const item = await ctx.db.get(args.itemId);
    if (!item || item.room_id !== room._id) {
      throw new Error("Wishlist item not found");
    }
    if (item.owner_user_id !== userId) {
      throw new Error("You can only fetch previews for your own items");
    }
    if (!item.item_link || item.item_image) return null;
    if (!/^https?:\/\//i.test(item.item_link)) return null;
    return { itemLink: item.item_link };
  },
});

export const savePreviewImage = internalMutation({
  args: {
    itemId: v.id("santa_wishlist_items"),
    imageUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { item_image: args.imageUrl });
    return null;
  },
});

// Renders <meta property="og:image" content="..."> style tags; tolerant about
// attribute order, quotes, and twitter:image fallbacks.
function extractImageTag(html: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const contentOf = (tag: string) =>
    /\bcontent\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
  const keyOf = (tag: string) =>
    /\bproperty\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ??
    /\bname\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ??
    "";

  for (const tag of metaTags) {
    const content = contentOf(tag);
    if (!content) continue;
    if (["og:image", "og:image:url", "og:image:secure_url"].includes(keyOf(tag)) &&
      content) {
      return content;
    }
  }
  for (const tag of metaTags) {
    const content = contentOf(tag);
    if (!content) continue;
    if (/^twitter:(image|image:url|image:src)$/.test(keyOf(tag))) {
      return content;
    }
  }
  return null;
}

async function resolveImageUrl(html: string, baseUrl: string) {
  const raw = extractImageTag(html);
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

export const fetchLinkPreview = action({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    itemId: v.id("santa_wishlist_items"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.runQuery(internal.linkPreview.getPreviewTarget, {
      roomCode: args.roomCode,
      userToken: args.userToken,
      itemId: args.itemId,
    });
    if (!target) return null;

    const response = await fetch(target.itemLink, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BuildioSecretSanta/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    // Preview tags live in the document head; stop once it is complete.
    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < PAGE_CHAR_LIMIT) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      await reader.cancel();
    }

    const imageUrl = await resolveImageUrl(html, response.url);
    if (!imageUrl || imageUrl.length > MAX_IMAGE_LENGTH) return null;
    if (!/^https?:\/\//i.test(imageUrl)) return null;

    await ctx.runMutation(internal.linkPreview.savePreviewImage, {
      itemId: args.itemId,
      imageUrl,
    });
    return null;
  },
});
