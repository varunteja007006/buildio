import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, mutation, query } from "./_generated/server";
import { getUserFromToken } from "./utils";

// Input caps so wishlists stay small and queries stay bounded.
const MAX_ITEM_LENGTH = 200;
const MAX_ITEM_LINK_LENGTH = 500;
const MAX_ITEMS_PER_PERSON = 20;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 500;
// Sanity cap so budgets stay reasonable in the UI.
const MAX_BUDGET_VALUE = 100_000_000;

async function getRoomOrThrow(ctx: QueryCtx, roomCode: string) {
  const room = await ctx.db
    .query("rooms")
    .withIndex("by_room_code", (q) => q.eq("room_code", roomCode))
    .unique();
  if (!room) throw new Error("Room not found");
  return room;
}

// Resolves the caller from their token and verifies they are a member of the
// room via the teams table. Never trusts a userId from the client.
export async function requireRoomMember(
  ctx: QueryCtx,
  roomCode: string,
  userToken: string,
): Promise<{ room: Doc<"rooms">; userId: Id<"users"> }> {

  const user = await getUserFromToken(ctx, userToken);
  if (!user.success || !user.id) throw new Error("Unauthorized");

  const room = await getRoomOrThrow(ctx, roomCode);

  const membership = await ctx.db
    .query("teams")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", room._id).eq("userId", user.id),
    )
    .unique();
  if (!membership) throw new Error("You are not a member of this room");

  return { room, userId: user.id };
}

async function getGame(ctx: QueryCtx, roomId: Id<"rooms">) {
  return ctx.db
    .query("santa_games")
    .withIndex("by_room", (q) => q.eq("room_id", roomId))
    .unique();
}

// Random derangement via Fisher-Yates plus a fix-up pass so NO participant
// draws themselves. With 2 participants A<->B is the only valid assignment.
function derange(count: number): number[] {
  const perm = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j]!, perm[i]!];
  }

  const fixed: number[] = [];
  for (let i = 0; i < count; i++) {
    if (perm[i] === i) fixed.push(i);
  }

  // An odd leftover fixed point is swapped with a random non-fixed position,
  // which always keeps the permutation a valid derangement.
  if (fixed.length % 2 === 1) {
    const i = fixed.pop()!;
    let j = i;
    while (j === i) j = Math.floor(Math.random() * count);
    [perm[i], perm[j]] = [perm[j]!, perm[i]!];
  }
  for (let k = 0; k + 1 < fixed.length; k += 2) {
    const a = fixed[k]!;
    const b = fixed[k + 1]!;
    [perm[a], perm[b]] = [perm[b]!, perm[a]!];
  }

  return perm;
}

// Full room state for the Secret Santa page: room, draw status, participants
// and ONLY the caller's own recipient (recipient names are never exposed
// to anyone but their santa).
export const getGameState = query({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    room: v.optional(
      v.object({
        _id: v.id("rooms"),
        room_name: v.string(),
        room_code: v.string(),
        ownerId: v.id("users"),
        created_at: v.number(),
      }),
    ),
    status: v.union(v.literal("lobby"), v.literal("drawn")),
    drawn_at: v.optional(v.number()),
    min_budget: v.optional(v.number()),
    max_budget: v.optional(v.number()),
    participants: v.array(
      v.object({
        user_id: v.id("users"),
        username: v.string(),
        is_owner: v.boolean(),
      }),
    ),
    my_recipient: v.optional(
      v.object({
        user_id: v.id("users"),
        username: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success || !user.id) {
      return {
        success: false,
        message: user.message || "User not found",
        status: "lobby" as const,
        participants: [],
      };
    }

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();
    if (!room) {
      return {
        success: false,
        message: "Room not found",
        status: "lobby" as const,
        participants: [],
      };
    }

    const membership = await ctx.db
      .query("teams")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user.id),
      )
      .unique();
    if (!membership) {
      return {
        success: false,
        message: "User not authorized to view this room",
        status: "lobby" as const,
        participants: [],
      };
    }

    const game = await getGame(ctx, room._id);
    const status = game?.status ?? "lobby";

    // Join teams -> users, in join order.
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .take(MAX_PARTICIPANTS);
    teams.sort((a, b) => a.created_at - b.created_at);

    const participants: {
      user_id: Id<"users">;
      username: string;
      is_owner: boolean;
    }[] = [];
    for (const team of teams) {
      const member: Doc<"users"> | null = await ctx.db.get(team.userId);
      if (member) {
        participants.push({
          user_id: member._id,
          username: member.username,
          is_owner: member._id === room.ownerId,
        });
      }
    }

    // Each santa sees only their own recipient.
    let myRecipient: { user_id: Id<"users">; username: string } | undefined;
    if (status === "drawn") {
      const assignment = await ctx.db
        .query("santa_assignments")
        .withIndex("by_room_and_santa", (q) =>
          q.eq("room_id", room._id).eq("santa_user_id", user.id),
        )
        .unique();
      if (assignment) {
        const recipient: Doc<"users"> | null = await ctx.db.get(
          assignment.recipient_user_id,
        );
        if (recipient) {
          myRecipient = {
            user_id: recipient._id,
            username: recipient.username,
          };
        }
      }
    }

    return {
      success: true,
      message: "Game state retrieved successfully",
      room: {
        _id: room._id,
        room_name: room.room_name,
        room_code: room.room_code,
        ownerId: room.ownerId,
        created_at: room.created_at,
      },
      status,
      drawn_at: game?.drawn_at,
      min_budget: game?.min_budget,
      max_budget: game?.max_budget,
      participants,
      my_recipient: myRecipient,
    };
  },
});

// Idempotently creates the per-room game doc. The owner calls this on mount,
// mirroring scribble's initializeGameSettings pattern.
export const initializeGame = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.union(v.id("santa_games"), v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success || !user.id) throw new Error("Unauthorized");

    const room = await getRoomOrThrow(ctx, args.roomCode);
    if (room.ownerId !== user.id) return null;

    const existing = await getGame(ctx, room._id);
    if (existing) return existing._id;

    return ctx.db.insert("santa_games", {
      room_id: room._id,
      status: "lobby",
      created_at: Date.now(),
    });
  },
});

// Owner-only draw (or re-draw: existing assignments are deleted first).
// Builds a fair random derangement and bulk-inserts the assignments.
export const runDraw = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );
    if (room.ownerId !== userId) {
      throw new Error("Only the room owner can run the draw");
    }

    const game = await getGame(ctx, room._id);
    if (!game) throw new Error("Game not initialized");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .take(MAX_PARTICIPANTS);
    if (teams.length < MIN_PARTICIPANTS) {
      return {
        success: false,
        message: `Need at least ${MIN_PARTICIPANTS} participants to run the draw`,
      };
    }

    const memberIds = teams.map((team) => team.userId);
    const perm = derange(memberIds.length);

    // Re-draw support: drop the previous round before inserting new pairs.
    const oldAssignments = await ctx.db
      .query("santa_assignments")
      .withIndex("by_room", (q) => q.eq("room_id", room._id))
      .collect();
    for (const assignment of oldAssignments) {
      await ctx.db.delete(assignment._id);
    }

    const now = Date.now();
    for (let i = 0; i < memberIds.length; i++) {
      await ctx.db.insert("santa_assignments", {
        room_id: room._id,
        santa_user_id: memberIds[i]!,
        recipient_user_id: memberIds[perm[i]!]!,
        created_at: now,
      });
    }

    await ctx.db.patch(game._id, { status: "drawn", drawn_at: now });

    return { success: true, message: "Draw complete! 🎁" };
  },
});

// Owner-only reset back to the lobby; deletes all assignments.
export const resetDraw = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );
    if (room.ownerId !== userId) {
      throw new Error("Only the room owner can reset the draw");
    }

    const game = await getGame(ctx, room._id);
    if (!game) throw new Error("Game not initialized");

    const assignments = await ctx.db
      .query("santa_assignments")
      .withIndex("by_room", (q) => q.eq("room_id", room._id))
      .collect();
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.patch(game._id, { status: "lobby", drawn_at: undefined });
    return null;
  },
});

// Owner-only gift budget (min and max). Editable at ANY game status — after
// the draw it still tells each santa how much to spend.
export const setBudget = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    minBudget: v.number(),
    maxBudget: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );
    if (room.ownerId !== userId) {
      throw new Error("Only the room owner can set the budget");
    }

    const budgets = [args.minBudget, args.maxBudget];
    for (const budget of budgets) {
      if (!Number.isFinite(budget)) {
        throw new Error("Budget values can't be negative");
      }
      if (budget < 0) {
        throw new Error("Budget values can't be negative");
      }
      if (budget > MAX_BUDGET_VALUE) {
        throw new Error("Budget values are capped at 100,000,000");
      }
    }
    if (args.minBudget > args.maxBudget) {
      throw new Error("Minimum budget can't be higher than the maximum");
    }

    const game = await getGame(ctx, room._id);
    if (!game) throw new Error("The game hasn't been initialized yet");

    await ctx.db.patch(game._id, {
      min_budget: args.minBudget,
      max_budget: args.maxBudget,
    });
    return null;
  },
});

// Owner-only removal of a participant. Kicking after a draw invalidates every
// assignment, so the game drops back to the lobby and must be redrawn.
export const kickParticipant = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    targetUserId: v.id("users"),
  },
  returns: v.object({
    kicked: v.boolean(),
    draw_reset: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );
    if (room.ownerId !== userId) {
      throw new Error("Only the room owner can kick participants");
    }
    if (args.targetUserId === room.ownerId) {
      throw new Error("The room owner can't be kicked");
    }

    const membership = await ctx.db
      .query("teams")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", room._id).eq("userId", args.targetUserId),
      )
      .unique();
    if (!membership) throw new Error("That user is not a participant");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .take(MAX_PARTICIPANTS);
    if (teams.length - 1 < MIN_PARTICIPANTS) {
      throw new Error(
        `Kicking would drop the room below the ${MIN_PARTICIPANTS}-participant minimum`,
      );
    }

    await ctx.db.delete(membership._id);

    // A drawn game is invalid once someone leaves, so reset it like the
    // owner just hit reset.
    let drawReset = false;
    const game = await getGame(ctx, room._id);
    if (game && game.status === "drawn") {
      const assignments = await ctx.db
        .query("santa_assignments")
        .withIndex("by_room", (q) => q.eq("room_id", room._id))
        .collect();
      for (const assignment of assignments) {
        await ctx.db.delete(assignment._id);
      }
      await ctx.db.patch(game._id, { status: "lobby", drawn_at: undefined });
      drawReset = true;
    }

    return { kicked: true, draw_reset: drawReset };
  },
});

// Adds a gift idea to the caller's own wishlist (length and count capped).
export const addWishItem = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    itemText: v.string(),
    itemLink: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );

    const itemText = args.itemText.trim();
    if (itemText.length === 0) throw new Error("Item text is required");
    if (itemText.length > MAX_ITEM_LENGTH) {
      throw new Error(`Items are limited to ${MAX_ITEM_LENGTH} characters`);
    }

    let itemLink: string | undefined;
    if (args.itemLink !== undefined) {
      itemLink = args.itemLink.trim();
      if (itemLink.length === 0) {
        itemLink = undefined;
      } else if (!/^https?:\/\/\S+$/.test(itemLink)) {
        throw new Error("Link must be a valid http(s) URL");
      } else if (itemLink.length > MAX_ITEM_LINK_LENGTH) {
        throw new Error(
          `Links are limited to ${MAX_ITEM_LINK_LENGTH} characters`,
        );
      }
    }

    const existing = await ctx.db
      .query("santa_wishlist_items")
      .withIndex("by_room_and_owner", (q) =>
        q.eq("room_id", room._id).eq("owner_user_id", userId),
      )
      .take(MAX_ITEMS_PER_PERSON);
    if (existing.length >= MAX_ITEMS_PER_PERSON) {
      throw new Error(`You can add up to ${MAX_ITEMS_PER_PERSON} items`);
    }

    await ctx.db.insert("santa_wishlist_items", {
      room_id: room._id,
      owner_user_id: userId,
      item_text: itemText,
      item_link: itemLink,
      created_at: Date.now(),
    });
    return null;
  },
});

// Removes an item, but only the item's owner may remove it.
export const removeWishItem = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    itemId: v.id("santa_wishlist_items"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );

    const item: Doc<"santa_wishlist_items"> | null = await ctx.db.get(
      args.itemId,
    );
    if (!item || item.room_id !== room._id) {
      throw new Error("Item not found");
    }
    if (item.owner_user_id !== userId) {
      throw new Error("You can only remove your own items");
    }

    await ctx.db.delete(item._id);
    return null;
  },
});

// The caller's own wishlist items, in add order.
export const getMyWishlist = query({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("santa_wishlist_items"),
      item_text: v.string(),
      item_link: v.optional(v.string()),
      item_image: v.optional(v.string()),
      created_at: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );

    const items = await ctx.db
      .query("santa_wishlist_items")
      .withIndex("by_room_and_owner", (q) =>
        q.eq("room_id", room._id).eq("owner_user_id", userId),
      )
      .take(MAX_ITEMS_PER_PERSON);

    return items
      .sort((a, b) => a.created_at - b.created_at)
      .map((item) => ({
        _id: item._id,
        item_text: item.item_text,
        item_link: item.item_link,
        item_image: item.item_image,
        created_at: item.created_at,
      }));
  },
});

// Wishlist of the person the caller is gifting. Only the assigned santa may
// read it — anyone else gets an error.
export const getWishlistOfRecipient = query({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("santa_wishlist_items"),
      item_text: v.string(),
      item_link: v.optional(v.string()),
      item_image: v.optional(v.string()),
      created_at: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { room, userId } = await requireRoomMember(
      ctx,
      args.roomCode,
      args.userToken,
    );

    const assignment = await ctx.db
      .query("santa_assignments")
      .withIndex("by_room_and_santa", (q) =>
        q.eq("room_id", room._id).eq("santa_user_id", userId),
      )
      .unique();
    if (!assignment) {
      throw new Error("You have no recipient yet");
    }

    const items = await ctx.db
      .query("santa_wishlist_items")
      .withIndex("by_room_and_owner", (q) =>
        q
          .eq("room_id", room._id)
          .eq("owner_user_id", assignment.recipient_user_id),
      )
      .take(MAX_ITEMS_PER_PERSON);

    return items
      .sort((a, b) => a.created_at - b.created_at)
      .map((item) => ({
        _id: item._id,
        item_text: item.item_text,
        item_link: item.item_link,
        item_image: item.item_image,
        created_at: item.created_at,
      }));
  },
});
