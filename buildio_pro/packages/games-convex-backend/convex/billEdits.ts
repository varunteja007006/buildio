import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { validateExpense } from "./billHelpers";

/** Renames a bill group. */
export const renameGroup = mutation({
  args: {
    groupId: v.id("bill_groups"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Group name is required");
    }
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    await ctx.db.patch(args.groupId, { name });
    return null;
  },
});

/** Renames a member. */
export const renameMember = mutation({
  args: {
    memberId: v.id("bill_members"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Member name is required");
    }
    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new Error("Member not found");
    }
    await ctx.db.patch(args.memberId, { name });
    return null;
  },
});

/**
 * Removes a member. Blocked while any expense still references them
 * (as payer or participant), and while they are the only member left.
 */
export const removeMember = mutation({
  args: {
    memberId: v.id("bill_members"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new Error("Member not found");
    }

    const paidExpense = await ctx.db
      .query("bill_expenses")
      .withIndex("by_payer", (q) => q.eq("payer_id", args.memberId))
      .first();
    if (paidExpense) {
      throw new Error(
        "This member paid for an expense. Delete or edit those expenses first.",
      );
    }

    const groupExpenses = await ctx.db
      .query("bill_expenses")
      .withIndex("by_group", (q) => q.eq("groupId", member.groupId))
      .collect();
    if (groupExpenses.some((e) => e.participant_ids.includes(args.memberId))) {
      throw new Error(
        "This member shares an expense. Edit it to drop them first.",
      );
    }

    const payments = await ctx.db
      .query("bill_payments")
      .withIndex("by_group", (q) => q.eq("groupId", member.groupId))
      .collect();
    if (
      payments.some((p) => p.from_id === member._id || p.to_id === member._id)
    ) {
      throw new Error("Members with repayment history cannot be removed");
    }

    const members = await ctx.db
      .query("bill_members")
      .withIndex("by_group", (q) => q.eq("groupId", member.groupId))
      .collect();
    if (members.length <= 1) {
      throw new Error("A group needs at least one member");
    }

    await ctx.db.delete(args.memberId);
    return null;
  },
});

/** Updates an expense's description, amount, or participants. Payer never changes. */
export const updateExpense = mutation({
  args: {
    groupId: v.id("bill_groups"),
    expenseId: v.id("bill_expenses"),
    description: v.string(),
    amountCents: v.number(),
    participantIds: v.array(v.id("bill_members")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.groupId !== args.groupId || expense.deleted_at) {
      throw new Error("Expense not found");
    }
    await validateExpense(
      ctx,
      { ...args, payerId: expense.payer_id },
      expense._id,
    );
    await ctx.db.patch(args.expenseId, {
      description: args.description.trim(),
      amount_cents: args.amountCents,
      participant_ids: args.participantIds,
    });
    return null;
  },
});
