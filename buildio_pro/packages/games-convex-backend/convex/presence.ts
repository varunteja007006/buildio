import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";

import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  returns: v.object({
    roomToken: v.string(),
    sessionToken: v.string(),
  }),
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    if (!userId) {
      throw new Error("Id not valid");
    }

    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  returns: v.array(
    v.object({
      userId: v.string(),
      online: v.boolean(),
      lastDisconnected: v.number(),
      name: v.string(),
      emoji: v.optional(v.string()),
      role: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { roomToken }) => {
    const peeps = await presence.list(ctx, roomToken);

    // Per-user reads here are required to resolve display names; the
    // @convex-dev/presence React hook only re-subscribes on join/leave,
    // not on every heartbeat.
    const peepsWithNames = await Promise.all(
      peeps.map(async (p) => {
        if (!p.userId) {
          return null;
        }

        const user = await ctx.db.get(p.userId as Id<"users">);
        if (!user) {
          return null;
        }

        return {
          userId: p.userId,
          online: p.online,
          lastDisconnected: p.lastDisconnected,
          name: user.username ?? "Unknown",
          ...(user.emoji ? { emoji: user.emoji } : {}),
          ...(user.role ? { role: user.role } : {}),
        };
      }),
    );

    return peepsWithNames.filter((p) => p !== null);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon.
    return await presence.disconnect(ctx, sessionToken);
  },
});
