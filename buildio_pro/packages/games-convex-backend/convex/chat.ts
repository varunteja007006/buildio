import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  getMatch,
  getTurnKey,
  normalizeGuess,
  recordGuess,
} from "./lib/scribbleMatch";
import { requireScribbleMember } from "./lib/scribbleRoom";
import { getUserFromToken } from "./utils";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_REACTION_LENGTH = 64;
const MAX_MESSAGES_RETURNED = 100;

export const getMessages = query({
  args: { roomCode: v.string(), userToken: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("chats"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      userId: v.id("users"),
      message: v.string(),
      isGuess: v.optional(v.boolean()),
      created_at: v.number(),
      sender: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const { room } = await requireScribbleMember(ctx, args);

    // Cap history shipped to subscribers: most recent messages only.
    const messages = await ctx.db
      .query("chats")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("desc")
      .take(MAX_MESSAGES_RETURNED);

    // Enrich with user details, restoring chronological order.
    const messagesWithUser = await Promise.all(
      messages.reverse().map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          _id: msg._id,
          _creationTime: msg._creationTime,
          roomId: msg.roomId,
          userId: msg.userId,
          message: msg.message,
          isGuess: msg.isGuess,
          created_at: msg.created_at,
          sender: user?.username || "Unknown",
        };
      }),
    );

    return messagesWithUser;
  },
});

export const sendMessage = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    message: v.string(),
    turnKey: v.union(v.string(), v.null()),
  },
  returns: v.union(
    v.literal("sent"),
    v.literal("correct"),
    v.literal("hidden"),
  ),
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError(
        `Messages must be 1–${MAX_MESSAGE_LENGTH} characters.`,
      );
    }
    const { room, user } = await requireScribbleMember(ctx, args);
    const now = Date.now();
    const recent = await ctx.db
      .query("chats")
      .withIndex("by_room_and_user_and_created_at", (q) =>
        q
          .eq("roomId", room._id)
          .eq("userId", user.id)
          .gt("created_at", now - 5000),
      )
      .take(8);
    if (recent.length >= 8)
      throw new ConvexError("Slow down before sending another message.");

    const match = await getMatch(ctx, room._id);
    const matchesPrompt =
      match?.phase === "drawing" &&
      normalizeGuess(message) ===
        normalizeGuess(match.prompts[match.turnIndex]!);
    let isGuess = false;
    if (matchesPrompt) {
      if (match.endsAt <= now || args.turnKey !== getTurnKey(match))
        return "hidden";
      isGuess = await recordGuess(ctx, match, user.id);
      if (!isGuess) return "hidden";
    }

    await ctx.db.insert("chats", {
      roomId: room._id,
      userId: user.id,
      message: isGuess ? "Guessed the drawing!" : message,
      isGuess,
      created_at: now,
    });
    return isGuess ? "correct" : "sent";
  },
});

export const getTeamReactions = query({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("team_reactions"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      userId: v.id("users"),
      reaction: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success || !user.id) throw new Error("User not found");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();

    if (!room) throw new Error("Room not found");

    const reactions = await ctx.db
      .query("team_reactions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("desc")
      .take(20); // Grab the 20 most recent reactions

    return reactions.map((reaction) => ({
      _id: reaction._id,
      _creationTime: reaction._creationTime,
      roomId: reaction.roomId,
      userId: reaction.userId,
      reaction: reaction.reaction,
    }));
  },
});

export const createTeamReaction = mutation({
  args: {
    roomCode: v.string(),
    userToken: v.string(),
    reaction: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      args.reaction.length === 0 ||
      args.reaction.length > MAX_REACTION_LENGTH
    ) {
      throw new Error(
        `Reaction must be between 1 and ${MAX_REACTION_LENGTH} characters`,
      );
    }

    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success || !user.id) throw new Error("User not found");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("room_code", args.roomCode))
      .unique();

    if (!room) throw new Error("Room not found");

    await ctx.db.insert("team_reactions", {
      roomId: room._id,
      userId: user.id,
      reaction: args.reaction,
      created_at: Date.now(),
    });

    return null;
  },
});
