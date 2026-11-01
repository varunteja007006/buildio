import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/** Name of the auto-created, non-deletable default topic. */
const DEFAULT_TOPIC_NAME = "Second Brain";

/** Upper bound for the list scan; book topics are few. */
const MAX_TOPICS = 200;

/** Lists every topic with the default topic first, then by creation time. */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("book_topics"),
      name: v.string(),
      createdAt: v.number(),
      isDefault: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("book_topics")
      .withIndex("by_created_at")
      .order("asc")
      .take(MAX_TOPICS);
    const sorted = [
      ...topics.filter((topic) => topic.is_default === true),
      ...topics.filter((topic) => topic.is_default !== true),
    ];
    return sorted.map((topic) => ({
      id: topic._id,
      name: topic.name,
      createdAt: topic.created_at,
      isDefault: topic.is_default === true,
    }));
  },
});

/** Creates a topic with a unique trimmed name, returning the new id. */
export const create = mutation({
  args: { name: v.string() },
  returns: v.id("book_topics"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Topic name cannot be empty");
    }

    const existing = await ctx.db
      .query("book_topics")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (existing) {
      throw new Error("Topic already exists");
    }

    return await ctx.db.insert("book_topics", {
      name,
      created_at: Date.now(),
      is_default: false,
    });
  },
});

/** Creates the default topic when missing, returning its id. Idempotent. */
export const ensureDefault = mutation({
  args: {},
  returns: v.id("book_topics"),
  handler: async (ctx) => {
    const candidates = await ctx.db
      .query("book_topics")
      .withIndex("by_name", (q) => q.eq("name", DEFAULT_TOPIC_NAME))
      .take(2);

    const existingDefault = candidates.find(
      (topic) => topic.is_default === true,
    );
    if (existingDefault) {
      return existingDefault._id;
    }

    // A pre-flag topic already uses the default name: adopt it instead of
    // inserting a confusing duplicate.
    const legacy = candidates[0];
    if (legacy) {
      await ctx.db.patch(legacy._id, { is_default: true });
      return legacy._id;
    }

    return await ctx.db.insert("book_topics", {
      name: DEFAULT_TOPIC_NAME,
      created_at: Date.now(),
      is_default: true,
    });
  },
});

/** Deletes a topic permanently; the default topic is protected. */
export const remove = mutation({
  args: { id: v.id("book_topics") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.id);
    if (topic === null) {
      // Already gone; deleting is idempotent.
      return null;
    }
    if (topic.is_default === true) {
      throw new Error("The default topic cannot be deleted");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
