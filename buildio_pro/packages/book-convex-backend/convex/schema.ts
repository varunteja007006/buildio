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
  // main (top-level) folder.
  book_folders: defineTable({
    name: v.string(),
    parent_id: v.optional(v.id("book_folders")),
    created_at: v.number(),
    // Optional favorite flag; pre-favorite documents read as unfavored.
    is_favorite: v.optional(v.boolean()),
  })
    .index("by_parent", ["parent_id"])
    .index("by_created_at", ["created_at"]),
});
