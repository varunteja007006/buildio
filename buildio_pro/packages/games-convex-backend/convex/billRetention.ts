import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { billExpiresAt, purgeBillRecordsBatch } from "./lib/billRetention";

export const expireAndPurge = internalMutation({
  args: { groupId: v.id("bill_groups") },
  returns: v.null(),
  handler: async (ctx, { groupId }): Promise<null> => {
    const group = await ctx.db.get(groupId);
    if (group) {
      if (billExpiresAt(group.created_at) > Date.now()) return null;
      // Remove the link first so no new expenses/payments can be added mid-purge.
      await ctx.db.delete(groupId);
    }
    if (!(await purgeBillRecordsBatch(ctx, groupId))) {
      await ctx.scheduler.runAfter(0, internal.billRetention.expireAndPurge, {
        groupId,
      });
    }
    return null;
  },
});

export const deleteExpiredGroups = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.null(),
  handler: async (ctx, { cursor }): Promise<null> => {
    const now = Date.now();
    // Six calendar months are always longer than 180 days. Check exact dates below.
    const candidates = await ctx.db
      .query("bill_groups")
      .withIndex("by_created_at", (q) =>
        q.lte("created_at", now - 180 * 24 * 60 * 60 * 1000),
      )
      .paginate({ cursor: cursor ?? null, numItems: 20 });
    for (const group of candidates.page) {
      if (billExpiresAt(group.created_at) <= now) {
        await ctx.scheduler.runAfter(0, internal.billRetention.expireAndPurge, {
          groupId: group._id,
        });
      }
    }
    if (!candidates.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.billRetention.deleteExpiredGroups,
        {
          cursor: candidates.continueCursor,
        },
      );
    }
    return null;
  },
});
