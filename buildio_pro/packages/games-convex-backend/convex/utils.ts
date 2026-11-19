import type { QueryCtx } from "./_generated/server";

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
