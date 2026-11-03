import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
  handler: async ({ db }) => {
    const cutoff = Date.now() - DAY_MS;

    const oldChats = await db
      .query("chats")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const chat of oldChats) {
      await db.delete(chat._id);
    }
  },
});

// Delete canvases not updated in 24 hours via the by_created_at index.
// Canvases created before created_at existed are patched with one on their
// next stroke, so they become eligible for cleanup after that.
export const deleteOldScribbleLines = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db }) => {
    const cutoff = Date.now() - DAY_MS;

    const oldLines = await db
      .query("scribble_lines")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const line of oldLines) {
      const lastTouched = line.updated_at ?? line.created_at;
      if (lastTouched !== undefined && lastTouched < cutoff) {
        await db.delete(line._id);
      }
    }
  },
});

// Delete Secret Santa data (games, assignments, wishlist items) older than
// 21 days, mirroring the story cleanup cadence.
export const deleteOldSantaData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ({ db }) => {
    const cutoff = Date.now() - 21 * DAY_MS;

    const oldGames = await db
      .query("santa_games")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const game of oldGames) {
      await db.delete(game._id);
    }

    const oldAssignments = await db
      .query("santa_assignments")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const assignment of oldAssignments) {
      await db.delete(assignment._id);
    }

    const oldItems = await db
      .query("santa_wishlist_items")
      .withIndex("by_created_at", (q) => q.lt("created_at", cutoff))
      .collect();
    for (const item of oldItems) {
      await db.delete(item._id);
    }
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
