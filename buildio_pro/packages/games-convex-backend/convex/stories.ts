import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getUserFromToken } from "./utils";

// Pause after a game ends before the room can start the next one. Protects
// against accidental double-clicks on "Stop".
const START_COOLDOWN_MS = 10_000;

export const createStory = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    storyId: v.optional(v.id("stories")),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const userResult = await getUserFromToken(ctx, args.userToken);
    if (!userResult.success || !userResult.id) {
      return {
        success: false,
        message: userResult.message,
      };
    }
    const userId = userResult.id;

    // Find room by code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();
    if (!room) {
      return {
        success: false,
        message: "Room not found.",
      };
    }

    const cooldownRemainingMs = (room.startCooldownUntil ?? 0) - Date.now();
    if (cooldownRemainingMs > 0) {
      return {
        success: false,
        message: `Please wait ${Math.ceil(
          cooldownRemainingMs / 1000,
        )}s before starting a new game.`,
      };
    }

    // Generate random strings if empty
    const randomString = Math.random().toString(36).substring(7);
    const finalTitle = args.title || `Story ${randomString}`;
    const finalDescription =
      args.description || `Description for ${finalTitle}`;

    // Create story
    const storyId = await ctx.db.insert("stories", {
      title: finalTitle,
      description: finalDescription,
      status: "started",
      roomId: room._id,
      created_at: Date.now(),
      created_by: userId,
    });

    return {
      success: true,
      message: "Story created successfully.",
      storyId,
    };
  },
});

export const completeStory = mutation({
  args: {
    storyId: v.id("stories"),
    userToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    storyId: v.optional(v.id("stories")),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const userResult = await getUserFromToken(ctx, args.userToken);
    if (!userResult.success) {
      return {
        success: false,
        message: userResult.message,
      };
    }

    // Check if story exists
    const story = await ctx.db.get(args.storyId);
    if (!story) {
      return {
        success: false,
        message: "Story not found.",
      };
    }

    // Optional: Check if user is the creator or in the room, but task doesn't specify

    // Don't let a repeated stop (e.g. a stale double-click) restart the pause.
    if (story.status === "completed") {
      return {
        success: false,
        message: "Story is already completed.",
      };
    }

    const completedAt = Date.now();
    await ctx.db.patch(args.storyId, { status: "completed" });
    await ctx.db.patch(story.roomId, {
      startCooldownUntil: completedAt + START_COOLDOWN_MS,
    });

    return {
      success: true,
      message: "Story completed successfully.",
      storyId: args.storyId,
    };
  },
});

export const getStartedStory = query({
  args: {
    userToken: v.string(),
    roomCode: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    story: v.optional(
      v.object({
        _id: v.id("stories"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(v.literal("started"), v.literal("completed")),
        roomId: v.id("rooms"),
        created_at: v.number(),
        created_by: v.id("users"),
      }),
    ),
    // When the room can start another game, and the server clock the client
    // should measure it against.
    cooldownEndsAt: v.optional(v.number()),
    serverNow: v.number(),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const userResult = await getUserFromToken(ctx, args.userToken);
    if (!userResult.success) {
      return {
        success: false,
        message: userResult.message,
        serverNow: Date.now(),
      };
    }

    // Find room by code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();
    if (!room) {
      return {
        success: false,
        message: "Room not found.",
        serverNow: Date.now(),
      };
    }

    const cooldownEndsAt = room.startCooldownUntil;

    // Find started story in room
    const story = await ctx.db
      .query("stories")
      .withIndex("by_room_status", (q) =>
        q.eq("roomId", room._id).eq("status", "started"),
      )
      .unique();
    if (!story) {
      return {
        success: false,
        message: "No started story found.",
        cooldownEndsAt,
        serverNow: Date.now(),
      };
    }

    const { _creationTime, ...storyWithoutCreationTime } = story;

    return {
      success: true,
      message: "Started story found.",
      story: storyWithoutCreationTime,
      cooldownEndsAt,
      serverNow: Date.now(),
    };
  },
});
