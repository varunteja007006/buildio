import { v } from "convex/values";

import { query } from "./_generated/server";
import { billExpiresAt } from "./lib/billRetention";
import schema from "./schema";

/** Group links are capabilities, as in bills.getGroup. Export a consistent full snapshot. */
export const getGroup = query({
  args: { groupId: v.id("bill_groups") },
  returns: v.union(
    v.object({
      group: schema.doc("bill_groups"),
      members: v.array(schema.doc("bill_members")),
      expenses: v.array(schema.doc("bill_expenses")),
      payments: v.array(schema.doc("bill_payments")),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { groupId }) => {
    const group = await ctx.db.get(groupId);
    if (!group) return null;
    const [members, expenses, payments] = await Promise.all([
      ctx.db
        .query("bill_members")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .collect(),
      ctx.db
        .query("bill_expenses")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .collect(),
      ctx.db
        .query("bill_payments")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .collect(),
    ]);
    return {
      group,
      members,
      expenses,
      payments,
      expiresAt: billExpiresAt(group.created_at),
    };
  },
});
