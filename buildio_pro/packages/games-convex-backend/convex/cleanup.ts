import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { getMatch } from "./lib/scribbleMatch";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SCRIBBLE_CLEANUP_BATCH = 300;
const LEGACY_CLEANUP_BATCH = 50;

// Delete "started" stories older than 1 hour, along with their points
// (previously orphaned).
export const deleteStaleStories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db }) => {
    const cutoff = Date.now() - HOUR_MS;

    const staleStories = await db
      .query("stories")
      .withIndex("created_at", (q) => q.lt("created_at", cutoff))
      .collect();

    for (const story of staleStories) {
      if (story.status !== "started") continue;
      const points = await db
        .query("storyPoints")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect();
      for (const point of points) {
        await db.delete(point._id);
      }
      await db.delete(story._id);
    }
  },
});

// Delete stories (and their points) older than 21 days instead of wiping
// every story in the database every 3 weeks.
export const clearStoriesAndPoints = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db }) => {
    const cutoff = Date.now() - 21 * DAY_MS;

    const oldStories = await db
      .query("stories")
      .withIndex("created_at", (q) => q.lt("created_at", cutoff))
      .collect();

    for (const story of oldStories) {
      const points = await db
        .query("storyPoints")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect();
      for (const point of points) {
        await db.delete(point._id);
      }
      await db.delete(story._id);
    }
  },
});

// Delete chats older than 24 hours via the by_created_at index.
export const deleteOldChats = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db, scheduler }) => {
    const cutoff = Date.now() - DAY_MS;

    const oldChats = await db
      .query("chats")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .take(SCRIBBLE_CLEANUP_BATCH);
    for (const chat of oldChats) {
      await db.delete(chat._id);
    }
    if (oldChats.length === SCRIBBLE_CLEANUP_BATCH) {
      await scheduler.runAfter(0, internal.cleanup.deleteOldChats, {});
    }
  },
});

// A drawing turn is at most five minutes, so day-old strokes are immutable.
export const deleteOldScribbleLines = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db, scheduler }) => {
    const cutoff = Date.now() - DAY_MS;

    const oldLines = await db
      .query("scribble_lines")
      .withIndex("by_created_at", (q) =>
        q.gt("created_at", 0).lt("created_at", cutoff),
      )
      .take(SCRIBBLE_CLEANUP_BATCH);
    for (const line of oldLines) {
      await db.delete(line._id);
    }
    if (oldLines.length === SCRIBBLE_CLEANUP_BATCH) {
      await scheduler.runAfter(0, internal.cleanup.deleteOldScribbleLines, {});
    }
  },
});

export const deleteLegacyScribbleLines = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    cutoff: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const cutoff = args.cutoff ?? Date.now() - DAY_MS;
    const lines = await ctx.db
      .query("scribble_lines")
      .withIndex("by_created_at", (q) =>
        q.eq("created_at", undefined).lt("_creationTime", cutoff),
      )
      .paginate({
        cursor: args.cursor ?? null,
        numItems: LEGACY_CLEANUP_BATCH,
      });

    for (const line of lines.page) {
      // Recheck eligibility on each page before deleting any stroke.
      if (line.created_at !== undefined || line._creationTime >= cutoff)
        continue;
      if (line.updated_at !== undefined && line.updated_at >= cutoff) continue;

      const room = await ctx.db.get(line.roomId);
      if (room) {
        const match = await getMatch(ctx, room._id);
        // An unmarked room without a match might still have a legacy canvas.
        if (!match && room.game !== "scribble") continue;
        if (match && match.canvasId === line.canvasId) continue;
      }
      await ctx.db.delete(line._id);
    }

    if (!lines.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.cleanup.deleteLegacyScribbleLines,
        {
          cursor: lines.continueCursor,
          cutoff,
        },
      );
    }
    return null;
  },
});

// One-time sweep for votes left behind before stories were deleted with their votes.
export const deleteOrphanedStoryPoints = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const points = await ctx.db
      .query("storyPoints")
      .withIndex("by_creation_time")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: LEGACY_CLEANUP_BATCH,
      });

    for (const point of points.page) {
      if (!(await ctx.db.get(point.storyId))) await ctx.db.delete(point._id);
    }

    if (!points.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.cleanup.deleteOrphanedStoryPoints,
        {
          cursor: points.continueCursor,
        },
      );
    }
    return null;
  },
});

// Run after confirming the deployed release and its rollback target no longer use this table.
export const purgeLegacyScribbleGameState = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db, scheduler }): Promise<null> => {
    const states = await db
      .query("scribble_game_state")
      .withIndex("by_creation_time")
      .take(LEGACY_CLEANUP_BATCH);
    for (const state of states) await db.delete(state._id);

    if (states.length === LEGACY_CLEANUP_BATCH) {
      await scheduler.runAfter(
        0,
        internal.cleanup.purgeLegacyScribbleGameState,
        {},
      );
    }
    return null;
  },
});

// Sweep Secret Santa data in bounded pages. Keep the cutoff fixed across the
// scheduled continuations so each daily sweep uses one consistent age limit.
export const deleteOldSantaData = internalMutation({
  args: {
    phase: v.optional(
      v.union(
        v.literal("santa_wishlist_items"),
        v.literal("santa_assignments"),
        v.literal("santa_games"),
      ),
    ),
    cursor: v.optional(v.string()),
    cutoff: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const cutoff = args.cutoff ?? Date.now() - 45 * DAY_MS;
    const phase = args.phase ?? "santa_wishlist_items";
    const batch = await ctx.db
      .query(phase)
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .paginate({ cursor: args.cursor ?? null, numItems: 100 });

    for (const row of batch.page) {
      const retainedSince =
        "drawn_at" in row ? (row.drawn_at ?? row.created_at) : row.created_at;
      if (retainedSince < cutoff) await ctx.db.delete(row._id);
    }

    if (!batch.isDone) {
      await ctx.scheduler.runAfter(0, internal.cleanup.deleteOldSantaData, {
        phase,
        cursor: batch.continueCursor,
        cutoff,
      });
    } else if (phase !== "santa_games") {
      await ctx.scheduler.runAfter(0, internal.cleanup.deleteOldSantaData, {
        phase:
          phase === "santa_wishlist_items"
            ? "santa_assignments"
            : "santa_games",
        cutoff,
      });
    }
    return null;
  },
});

// Delete team reactions older than 24 hours (previously deleted ALL
// reactions every hour).
export const deleteOldTeamReactions = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db }) => {
    const cutoff = Date.now() - DAY_MS;

    const oldReactions = await db
      .query("team_reactions")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const reaction of oldReactions) {
      await db.delete(reaction._id);
    }
  },
});
