import { v } from "convex/values";

import { mutation } from "./_generated/server";

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
    expenseId: v.id("bill_expenses"),
    description: v.string(),
    amountCents: v.number(),
    participantIds: v.array(v.id("bill_members")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const description = args.description.trim();
    if (description.length === 0) {
      throw new Error("Description is required");
    }
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be a positive amount");
    }
    if (args.participantIds.length === 0) {
      throw new Error("At least one participant is required");
    }

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const members = await ctx.db
      .query("bill_members")
      .withIndex("by_group", (q) => q.eq("groupId", expense.groupId))
      .collect();
    const memberIds = new Set(members.map((m) => m._id));
    for (const participantId of args.participantIds) {
      if (!memberIds.has(participantId)) {
        throw new Error("Participants must be members of the group");
      }
    }

    await ctx.db.patch(args.expenseId, {
      description,
      amount_cents: args.amountCents,
      participant_ids: args.participantIds,
    });
    return null;
  },
});
