import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export async function isRoomMember(
  ctx: QueryCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("teams")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .unique();
  return membership !== null;
}

export const getUserFromToken = async (ctx: QueryCtx, token: string) => {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_token", (q) => q.eq("user_token", token))
    .unique();
  if (!user) {
    return {
      success: false as const,
      message: "User not found.",
      isFound: false as const,
    };
  }
  return {
    success: true as const,
    id: user._id,
    username: user.username,
    ...(user.emoji ? { emoji: user.emoji } : {}),
    ...(user.role ? { role: user.role } : {}),
    message: "User found.",
    isFound: true as const,
  };
};
