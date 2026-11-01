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
  })
    .index("by_name", ["name"])
    .index("by_created_at", ["created_at"]),
});
