import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    user_token: v.string(),
    created_at: v.number(),
    last_active: v.optional(v.number()),
  }).index("by_user_token", ["user_token"]),

  rooms: defineTable({
    room_name: v.string(),
    room_code: v.string(),
    created_at: v.number(),
    ownerId: v.id("users"), // replaces inference from teams
  })
    .index("by_room_code", ["room_code"])
    .index("by_owner", ["ownerId"]),

  teams: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    created_at: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  team_reactions: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    reaction: v.string(), // e.g., "like", "dislike", "heart"
    created_at: v.optional(v.number()), // set on insert; used by cleanup cutoffs
  })
    .index("by_room_and_user", ["roomId", "userId"])
    .index("by_room", ["roomId"])
    .index("by_created_at", ["created_at"]),

  stories: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("started"), v.literal("completed")),
    roomId: v.id("rooms"),
    created_at: v.number(),
    created_by: v.id("users"),
  })
    .index("by_room", ["roomId"])
    .index("by_room_status", ["roomId", "status"])
    .index("by_status", ["status"])
    .index("created_at", ["created_at"]),

  storyPoints: defineTable({
    userId: v.id("users"),
    storyId: v.id("stories"),
    story_point: v.optional(v.union(v.number(), v.string())), // flexible card deck
    created_at: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_user", ["userId"])
    .index("by_story_and_user", ["storyId", "userId"]),

  chats: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    message: v.string(),
    isGuess: v.optional(v.boolean()),
    created_at: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_created_at", ["created_at"]),

  // One document per stroke. Concurrent drawers upsert their own strokes by
  // id, so nobody's save can clobber another player's drawing.
  scribble_lines: defineTable({
    roomId: v.id("rooms"),
    playerId: v.id("users"),
    strokeId: v.string(), // client-generated stroke id, used for upserts
    tool: v.string(), // "pen" | "eraser"
    points: v.array(v.number()), // flat [x0, y0, x1, y1, ...]
    strokeWidth: v.number(),
    strokeColor: v.string(),
    isComplete: v.boolean(), // false while drawing, true when mouse up
    // timestamps to allow cleanup of stale canvases
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_stroke", ["roomId", "strokeId"])
    .index("by_created_at", ["created_at"]),

  scribble_games: defineTable({
    room_code: v.string(),
    rounds: v.number(),
    timer: v.number(), // seconds per turn
    list_of_words: v.array(v.string()),
    word_filters: v.optional(v.array(v.string())),
    score: v.record(v.string(), v.number()), // userId -> score
    created_at: v.number(),
  }).index("by_room_code", ["room_code"]),

  // Group expense splitting (bill-splitter app)
  bill_groups: defineTable({
    name: v.string(),
    currency: v.string(), // currency symbol, e.g. "$" or "€"
    created_at: v.number(),
  }).index("by_created_at", ["created_at"]),

  bill_members: defineTable({
    groupId: v.id("bill_groups"),
    name: v.string(),
    created_at: v.number(),
  }).index("by_group", ["groupId"]),

  bill_expenses: defineTable({
    groupId: v.id("bill_groups"),
    description: v.string(),
    amount_cents: v.number(), // integer cents to avoid float drift
    payer_id: v.id("bill_members"),
    participant_ids: v.array(v.id("bill_members")), // who shares this expense
    created_at: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_payer", ["payer_id"]),

  scribble_game_state: defineTable({
    room_code: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished"),
    ),
    currentTurn: v.number(), // 1 to totalTurns
    totalTurns: v.number(), // rounds × number of users
    currentWord: v.string(), // Current word to draw
    turnStartTime: v.number(), // Timestamp when current turn started
    turnDuration: v.number(), // Seconds per turn (from settings.timer)
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_room_code", ["room_code"]),
});
