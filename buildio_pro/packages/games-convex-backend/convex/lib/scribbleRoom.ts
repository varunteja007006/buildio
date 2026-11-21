import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getUserFromToken } from "../utils";

export const MAX_ROOM_PLAYERS = 16;
export const PRESENCE_WINDOW_MS = 45_000;

export async function findScribbleRoom(ctx: QueryCtx, code: string) {
  const room = await ctx.db
    .query("rooms")
    .withIndex("by_room_code", (q) =>
      q.eq("room_code", code.trim().toUpperCase()),
    )
    .unique();
  if (!room || room.game === "scribble") return room;

  // Older rooms didn't record the app, but opening them created settings.
  return (await getScribbleSettings(ctx, room.room_code)) ? room : null;
}

export function getScribbleSettings(ctx: QueryCtx, roomCode: string) {
  return ctx.db
    .query("scribble_games")
    .withIndex("by_room_code", (q) => q.eq("room_code", roomCode))
    .unique();
}

export function getMembership(
  ctx: QueryCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("teams")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .first();
}

export function getRecentMembers(ctx: QueryCtx, roomId: Id<"rooms">) {
  return ctx.db
    .query("teams")
    .withIndex("by_room_and_scribble_seen_at", (q) => q.eq("roomId", roomId))
    .order("desc")
    .take(MAX_ROOM_PLAYERS);
}

export function isPresent(seenAt: number | undefined, now: number) {
  return seenAt !== undefined && seenAt > now - PRESENCE_WINDOW_MS;
}

export function getScribbleHostId(room: Doc<"rooms">) {
  return room.scribbleHostId ?? room.ownerId;
}

export async function reassignAbsentScribbleHost(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  onlineMemberId: Id<"users">,
  now: number,
) {
  const hostId = getScribbleHostId(room);
  if (hostId === onlineMemberId) return;
  const host = await getMembership(ctx, room._id, hostId);
  if (isPresent(host?.scribbleSeenAt ?? room.created_at, now)) return;

  const [nextHost] = (await getRecentMembers(ctx, room._id))
    .filter((member) => isPresent(member.scribbleSeenAt, now))
    .sort(
      (a, b) =>
        a.created_at - b.created_at || a._creationTime - b._creationTime,
    );
  if (nextHost) {
    await ctx.db.patch("rooms", room._id, { scribbleHostId: nextHost.userId });
  }
}

export async function requireScribbleMember(
  ctx: QueryCtx,
  args: { roomCode: string; userToken: string },
) {
  const user = await getUserFromToken(ctx, args.userToken);
  if (!user.success)
    throw new ConvexError("Choose a display name to continue.");
  const room = await findScribbleRoom(ctx, args.roomCode);
  if (!room) throw new ConvexError("Scribble room not found.");
  const member = await getMembership(ctx, room._id, user.id);
  if (!member) throw new ConvexError("Join the room first.");
  return { user, room, member, isHost: getScribbleHostId(room) === user.id };
}

export async function requireScribbleHost(
  ctx: QueryCtx,
  args: { roomCode: string; userToken: string },
) {
  const access = await requireScribbleMember(ctx, args);
  if (!access.isHost) throw new ConvexError("Only the host can do this.");
  return access;
}
