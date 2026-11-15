import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The Better Auth component manages its own tables internally
// (non-local install), so nothing auth-related is defined here.
export default defineSchema({
  // Book app (personal reading/notes app)
  book_topics: defineTable({
    name: v.string(),
    created_at: v.number(),
    // Present and true only on the auto-created default topic; optional so
    // pre-existing documents without the field still validate on read.
    is_default: v.optional(v.boolean()),
    // Optional favorite flag; pre-favorite documents read as unfavored.
    is_favorite: v.optional(v.boolean()),
  })
    .index("by_name", ["name"])
    .index("by_created_at", ["created_at"]),
  // Nested folders for organizing book content; a missing parent_id marks a
  // main (top-level) folder. Folders are scoped to a topic; the one-time
  // backfill assigned legacy rows to the default topic.
  book_folders: defineTable({
    name: v.string(),
    parent_id: v.optional(v.id("book_folders")),
    topic_id: v.id("book_topics"),
    created_at: v.number(),
    // Optional favorite flag; pre-favorite documents read as unfavored.
    is_favorite: v.optional(v.boolean()),
  })
    .index("by_parent", ["parent_id"])
    .index("by_created_at", ["created_at"])
    // Per-topic listing in creation order and the per-topic main-folder
    // count. Does not match rows where topic_id is still undefined; the
    // backfill assigns those to the default topic.
    .index("by_topic_created", ["topic_id", "created_at"]),
  // Books are scoped to a topic; per-user scoping returns once auth is
  // set up in the app. `doc` is the JSON-encoded BlockNote document and
  // is absent until the first save.
  books: defineTable({
    title: v.string(),
    doc: v.optional(v.string()),
    topic_id: v.id("book_topics"),
    createdAt: v.number(),
    // Optional favorite flag; pre-favorite documents read as unfavored.
    is_favorite: v.optional(v.boolean()),
  })
    .index("by_created", ["createdAt"])
    // Per-topic bookshelf pages, newest first. Does not match rows where
    // topic_id is still undefined; the backfill assigns those.
    .index("by_topic_created", ["topic_id", "createdAt"]),
});
