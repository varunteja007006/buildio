import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  findScribbleRoom,
  getMembership,
  getRecentMembers,
  getScribbleSettings,
  isPresent,
  MAX_ROOM_PLAYERS,
  reassignAbsentScribbleHost,
  requireScribbleHost,
  requireScribbleMember,
} from "./lib/scribbleRoom";
import { getUserFromToken } from "./utils";

const roomArgs = { roomCode: v.string(), userToken: v.string() };

async function checkCapacity(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  membership: Doc<"teams"> | null,
  now: number,
) {
  if (isPresent(membership?.scribbleSeenAt, now)) return;
  const members = await getRecentMembers(ctx, room._id);
  if (
    members.length === MAX_ROOM_PLAYERS &&
    isPresent(members[members.length - 1]?.scribbleSeenAt, now)
  ) {
    throw new ConvexError(
      `This room is full (${MAX_ROOM_PLAYERS} guests online).`,
    );
  }
}

export const enter = mutation({
  args: roomArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success)
      throw new ConvexError("Choose a display name to continue.");
    const room = await findScribbleRoom(ctx, args.roomCode);
    if (!room)
      throw new ConvexError("Scribble room not found. Check the room code.");

    const membership = await getMembership(ctx, room._id, user.id);
    const now = Date.now();
    await checkCapacity(ctx, room, membership, now);
    if (membership) {
      await ctx.db.patch(membership._id, { scribbleSeenAt: now });
    } else {
      await ctx.db.insert("teams", {
        roomId: room._id,
        userId: user.id,
        created_at: now,
        scribbleSeenAt: now,
      });
    }
    if (!room.game) await ctx.db.patch(room._id, { game: "scribble" });
    await reassignAbsentScribbleHost(ctx, room, user.id, now);
    return null;
  },
});

export const heartbeat = mutation({
  args: roomArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const { member, room } = await requireScribbleMember(ctx, args);
    const now = Date.now();
    if (now - (member.scribbleSeenAt ?? 0) < 5000) return null;
    await checkCapacity(ctx, room, member, now);
    await ctx.db.patch(member._id, { scribbleSeenAt: now });
    await reassignAbsentScribbleHost(ctx, room, member.userId, now);
    return null;
  },
});

export const transferHost = mutation({
  args: { ...roomArgs, targetUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { room, user } = await requireScribbleHost(ctx, args);
    if (user.id === args.targetUserId) return null;
    const recipient = await getMembership(ctx, room._id, args.targetUserId);
    if (!isPresent(recipient?.scribbleSeenAt, Date.now())) {
      throw new ConvexError("Choose a guest who is online in this room.");
    }
    await ctx.db.patch("rooms", room._id, {
      scribbleHostId: args.targetUserId,
    });
    return null;
  },
});

export const recentRooms = query({
  args: { userToken: v.string() },
  returns: v.array(v.object({ code: v.string(), name: v.string() })),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userToken);
    if (!user.success) return [];
    const memberships = await ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .order("desc")
      .take(50);
    const rooms = await Promise.all(
      memberships.map(async (membership) => {
        const room = await ctx.db.get(membership.roomId);
        if (!room) return null;
        if (
          room.game !== "scribble" &&
          !(await getScribbleSettings(ctx, room.room_code))
        ) {
          return null;
        }
        return { code: room.room_code, name: room.room_name };
      }),
    );
    return rooms.filter((room) => room !== null);
  },
});
