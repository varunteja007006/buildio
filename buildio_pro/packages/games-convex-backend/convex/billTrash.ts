import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { expenseShape, expenseView, validateExpense } from "./billHelpers";

export const listExpenses = query({
  args: {
    groupId: v.id("bill_groups"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(expenseShape),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!(await ctx.db.get(args.groupId))) throw new Error("Group not found");
    const result = await ctx.db
      .query("bill_expenses")
      .withIndex("by_group_and_deleted_at", (q) =>
        q.eq("groupId", args.groupId).gt("deleted_at", 0),
      )
      .order("desc")
      .paginate({
        ...args.paginationOpts,
        numItems: Math.min(50, args.paginationOpts.numItems),
      });
    return {
      page: result.page.map(expenseView),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const restoreExpense = mutation({
  args: { groupId: v.id("bill_groups"), expenseId: v.id("bill_expenses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.groupId !== args.groupId)
      throw new Error("Expense not found");
    if (!expense.deleted_at) return null;
    await validateExpense(
      ctx,
      {
        groupId: args.groupId,
        description: expense.description,
        amountCents: expense.amount_cents,
        payerId: expense.payer_id,
        participantIds: expense.participant_ids,
      },
      expense._id,
    );
    await ctx.db.patch(expense._id, { deleted_at: undefined });
    return null;
  },
});

export const permanentlyDeleteExpense = mutation({
  args: { groupId: v.id("bill_groups"), expenseId: v.id("bill_expenses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.groupId !== args.groupId || !expense.deleted_at) {
      throw new Error("Deleted expense not found");
    }
    await ctx.db.delete(expense._id);
    return null;
  },
});
