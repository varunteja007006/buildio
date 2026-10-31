import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  expenseShape,
  expenseView,
  paymentShape,
  paymentView,
  validateExpense,
} from "./billHelpers";

const MAX_MEMBERS = 50;

/**
 * Creates a bill group with its initial members.
 * Returns the group id and the inserted member ids (in input order).
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
    memberNames: v.array(v.string()),
  },
  returns: v.object({
    groupId: v.id("bill_groups"),
    memberIds: v.array(v.id("bill_members")),
  }),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Group name is required");
    }
    if (args.memberNames.length === 0) {
      throw new Error("At least one member is required");
    }
    if (args.memberNames.length > MAX_MEMBERS) {
      throw new Error(`A group can have at most ${MAX_MEMBERS} members`);
    }

    const now = Date.now();
    const groupId = await ctx.db.insert("bill_groups", {
      name,
      currency: args.currency.trim() || "$",
      created_at: now,
    });

    const memberIds: Array<Id<"bill_members">> = [];
    for (const rawName of args.memberNames) {
      const memberName = rawName.trim();
      if (memberName.length === 0) {
        continue;
      }
      const memberId = await ctx.db.insert("bill_members", {
        groupId,
        name: memberName,
        created_at: now,
      });
      memberIds.push(memberId);
    }

    return { groupId, memberIds };
  },
});

const memberShape = v.object({
  id: v.id("bill_members"),
  name: v.string(),
});

/** Loads a group with all members and expenses, or null if it does not exist. */
export const getGroup = query({
  args: { groupId: v.id("bill_groups") },
  returns: v.union(
    v.object({
      name: v.string(),
      currency: v.string(),
      createdAt: v.number(),
      members: v.array(memberShape),
      expenses: v.array(expenseShape),
      payments: v.array(paymentShape),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      return null;
    }

    const [members, expenses, payments] = await Promise.all([
      ctx.db
        .query("bill_members")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
      ctx.db
        .query("bill_expenses")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
      ctx.db
        .query("bill_payments")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
    ]);

    return {
      name: group.name,
      currency: group.currency,
      createdAt: group.created_at,
      members: members
        .sort((a, b) => a.created_at - b.created_at)
        .map((m) => ({ id: m._id, name: m.name })),
      expenses: expenses
        .filter((e) => !e.deleted_at)
        .sort((a, b) => b.created_at - a.created_at)
        .map(expenseView),
      payments: payments.filter((p) => !p.voided_at).map(paymentView),
    };
  },
});

/** Adds a member to an existing group. */
export const addMember = mutation({
  args: {
    groupId: v.id("bill_groups"),
    name: v.string(),
  },
  returns: v.id("bill_members"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Member name is required");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const members = await ctx.db
      .query("bill_members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    if (members.length >= MAX_MEMBERS) {
      throw new Error(`A group can have at most ${MAX_MEMBERS} members`);
    }

    return await ctx.db.insert("bill_members", {
      groupId: args.groupId,
      name,
      created_at: Date.now(),
    });
  },
});

/** Adds an expense paid by one member and shared among the given participants. */
export const addExpense = mutation({
  args: {
    groupId: v.id("bill_groups"),
    description: v.string(),
    amountCents: v.number(),
    payerId: v.id("bill_members"),
    participantIds: v.array(v.id("bill_members")),
  },
  returns: v.id("bill_expenses"),
  handler: async (ctx, args) => {
    await validateExpense(ctx, args);
    return await ctx.db.insert("bill_expenses", {
      groupId: args.groupId,
      description: args.description.trim(),
      amount_cents: args.amountCents,
      payer_id: args.payerId,
      participant_ids: args.participantIds,
      created_at: Date.now(),
    });
  },
});

/** Moves an expense to trash; recoverable until explicitly deleted permanently. */
export const deleteExpense = mutation({
  args: { groupId: v.id("bill_groups"), expenseId: v.id("bill_expenses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.groupId !== args.groupId) {
      throw new Error("Expense not found");
    }
    if (!expense.deleted_at)
      await ctx.db.patch(args.expenseId, { deleted_at: Date.now() });
    return null;
  },
});

/** Deletes a group together with its members and expenses. */
export const deleteGroup = mutation({
  args: { groupId: v.id("bill_groups") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const [members, expenses, payments] = await Promise.all([
      ctx.db
        .query("bill_members")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
      ctx.db
        .query("bill_expenses")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
      ctx.db
        .query("bill_payments")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect(),
    ]);

    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }
    for (const payment of payments) await ctx.db.delete(payment._id);
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    await ctx.db.delete(args.groupId);
    return null;
  },
});
