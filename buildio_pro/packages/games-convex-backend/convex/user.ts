import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getUserFromToken } from "./utils";

const profileEmojiValidator = v.union(
  v.literal("😊"),
  v.literal("😃"),
  v.literal("😎"),
  v.literal("🤓"),
  v.literal("😇"),
  v.literal("🤖"),
  v.literal("👻"),
  v.literal("🐶"),
  v.literal("🐱"),
  v.literal("🐰"),
  v.literal("🥳"),
  v.literal("🤩"),
  v.literal("🥰"),
  v.literal("😈"),
  v.literal("🥸"),
  v.literal("🤠"),
  v.literal("👽"),
  v.literal("💩"),
  v.literal("🐸"),
  v.literal("🦊"),
  v.literal("🐼"),
  v.literal("🐵"),
  v.literal("🦄"),
  v.literal("🐻"),
  v.literal("🐯"),
  v.literal("🦁"),
  v.literal("🐨"),
  v.literal("🐷"),
  v.literal("🐙"),
  v.literal("🦋"),
);

const roleValidator = v.union(
  v.literal("frontend"),
  v.literal("backend"),
  v.literal("mobile"),
  v.literal("qa"),
  v.literal("ba"),
);

export const createUser = mutation({
  args: {
    name: v.string(),
    roomCode: v.optional(v.string()),
    role: v.optional(roleValidator),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    token: v.string(),
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
  }),

  handler: async (ctx, args) => {
    const token = globalThis.crypto.randomUUID();
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      username: args.name,
      user_token: token,
      created_at: now,
      last_active: now,
      ...(args.role ? { role: args.role } : {}),
    });

    let message = "User created successfully";
    let teamId: Id<"teams"> | undefined;

    if (args.roomCode) {
      const roomCode = args.roomCode;
      const room = await ctx.db
        .query("rooms")
        .withIndex("by_room_code", (q) => q.eq("room_code", roomCode))
        .unique();

      if (room) {
        teamId = await ctx.db.insert("teams", {
          roomId: room._id,
          userId,
          created_at: now,
        });
        message = "User created and joined room successfully";
      } else {
        message =
          "User created successfully, but room not found. Please join the room separately.";
      }
    }

    return {
      success: true,
      message,
      token,
      userId,
      teamId,
    };
  },
});

export const getUserByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.id("users"),
      username: v.string(),
      emoji: v.optional(profileEmojiValidator),
      role: v.optional(roleValidator),
      success: v.literal(true),
      message: v.string(),
      isFound: v.literal(true),
    }),
    v.object({
      success: v.literal(false),
      message: v.string(),
      isFound: v.literal(false),
    }),
  ),

  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    return user;
  },
});

export const setProfileEmoji = mutation({
  args: {
    token: v.string(),
    emoji: profileEmojiValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user.success || !user.id) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user.id, { emoji: args.emoji });
    return null;
  },
});

export const setUserRole = mutation({
  args: {
    token: v.string(),
    // Optional so passing undefined (or omitting) clears the role.
    role: v.optional(roleValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user.success || !user.id) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user.id, { role: args.role });
    return null;
  },
});
