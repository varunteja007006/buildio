import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, isRoomMember } from "./utils";

export const captureStoryPoint = mutation({
  args: {
    storyId: v.id("stories"),
    storypoint: v.union(v.number(), v.string()),
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    storyPointId: v.optional(v.id("storyPoints")),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const userResult = await getUserFromToken(ctx, args.token);
    if (!userResult.success || !userResult?.id) {
      return {
        success: false,
        message: userResult.message,
      };
    }

    const userId = userResult.id;

    // Check if story exists
    const story = await ctx.db.get(args.storyId);
    if (!story) {
      return {
        success: false,
        message: "Story not found.",
      };
    }

    if (!(await isRoomMember(ctx, story.roomId, userId))) {
      return { success: false, message: "Join the room before voting." };
    }
    if (story.status !== "started") {
      return { success: false, message: "Voting is closed for this story." };
    }

    const existing = await ctx.db
      .query("storyPoints")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", userId),
      )
      .unique();

    let storyPointId;
    if (existing) {
      storyPointId = existing._id;
      await ctx.db.patch(existing._id, { story_point: args.storypoint });
    } else {
      storyPointId = await ctx.db.insert("storyPoints", {
        userId,
        storyId: args.storyId,
        story_point: args.storypoint,
        created_at: Date.now(),
      });
    }

    return {
      success: true,
      message: "Story point captured successfully.",
      storyPointId,
    };
  },
});

export const getStoryPoints = query({
  args: {
    storyId: v.id("stories"),
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    storyPoints: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          username: v.string(),
          story_point: v.optional(v.union(v.number(), v.string())),
          isCurrentUser: v.boolean(),
        }),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const currentUserResult = await getUserFromToken(ctx, args.token);
    if (!currentUserResult.success || !currentUserResult.id) {
      return {
        success: false,
        message: currentUserResult.message,
      };
    }
    const currentUserId = currentUserResult.id;

    // Check if story exists
    const story = await ctx.db.get(args.storyId);
    if (!story) {
      return {
        success: false,
        message: "Story not found.",
      };
    }

    if (!(await isRoomMember(ctx, story.roomId, currentUserId))) {
      return { success: false, message: "Join the room to view its votes." };
    }

    const storyPoints = ctx.db
      .query("storyPoints")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId));

    const result = [];
    for await (const sp of storyPoints) {
      const user = await ctx.db.get(sp.userId);
      if (user) {
        const isCurrentUser = sp.userId === currentUserId;
        result.push({
          userId: sp.userId,
          username: user.username,
          ...(isCurrentUser || story.status === "completed"
            ? { story_point: sp.story_point }
            : {}),
          isCurrentUser,
        });
      }
    }

    return {
      success: true,
      message: "Story points retrieved successfully.",
      storyPoints: result,
    };
  },
});

export const getStoryPointsStats = query({
  args: {
    token: v.string(),
    storyId: v.optional(v.id("stories")),
    roomCode: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    chartData: v.optional(
      v.array(
        v.object({
          name: v.string(),
          value: v.number(),
        }),
      ),
    ),
    avgPoints: v.optional(v.number()),
    totalVoters: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Validate user token
    const currentUserResult = await getUserFromToken(ctx, args.token);
    if (!currentUserResult.success) {
      return {
        success: false,
        message: currentUserResult.message,
      };
    }

    let storyId = args.storyId;
    let room: Doc<"rooms"> | null = null;

    if (storyId) {
      // Validate story exists and is completed
      const story = await ctx.db.get(storyId);
      if (!story) {
        return {
          success: false,
          message: "Story not found.",
        };
      }
      room = await ctx.db.get(story.roomId);
      if (!room) {
        return {
          success: false,
          message: "Room not found.",
        };
      }
      if (!(await isRoomMember(ctx, room._id, currentUserResult.id))) {
        return {
          success: false,
          message: "Join the room to view its results.",
        };
      }
      if (story.status !== "completed") {
        return { success: true, message: "Story is not completed." };
      }
    } else if (args.roomCode) {
      // Get room from roomCode
      room = await ctx.db
        .query("rooms")
        .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode!))
        .unique();
      if (!room) {
        return {
          success: false,
          message: "Room not found.",
        };
      }

      if (!(await isRoomMember(ctx, room._id, currentUserResult.id))) {
        return {
          success: false,
          message: "Join the room to view its results.",
        };
      }

      // Get the last completed story in the room
      const lastStory = await ctx.db
        .query("stories")
        .withIndex("by_room_status", (q) =>
          q.eq("roomId", room!._id).eq("status", "completed"),
        )
        .order("desc")
        .first();
      if (!lastStory) {
        return {
          success: false,
          message: "No completed stories found in the room.",
        };
      }
      storyId = lastStory._id;
    } else {
      return {
        success: false,
        message: "Either storyId or roomCode must be provided.",
      };
    }

    const storyPoints = ctx.db
      .query("storyPoints")
      .withIndex("by_story", (q) => q.eq("storyId", storyId));

    const pointCounts = new Map<string, number>();
    let total = 0;
    let validCount = 0;

    for await (const sp of storyPoints) {
      const point = sp.story_point;
      if (point !== undefined) {
        const numPoint = typeof point === "string" ? parseFloat(point) : point;
        if (!isNaN(numPoint)) {
          const key = point.toString();
          pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
          total += numPoint;
          validCount++;
        }
      }
    }

    const chartData = Array.from(pointCounts, ([name, value]) => ({
      name,
      value,
    }));

    // Sort by numeric value ascending
    chartData.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));

    const avgPoints =
      validCount > 0 ? Math.round((total / validCount) * 10) / 10 : 0;

    return {
      success: true,
      message: "Story points stats retrieved successfully.",
      chartData,
      avgPoints,
      totalVoters: validCount,
    };
  },
});
