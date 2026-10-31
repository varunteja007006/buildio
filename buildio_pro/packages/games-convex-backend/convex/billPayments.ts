import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { expenseView, loadBillGroup, paymentView } from "./billHelpers";
import { computeBalances, validateRepayment } from "./lib/billMath";

/** Manual ledger, not bank verification. Anyone with the group link can record/undo. */
export const recordPayment = mutation({
  args: {
    groupId: v.id("bill_groups"),
    fromId: v.id("bill_members"),
    toId: v.id("bill_members"),
    amountCents: v.number(),
  },
  returns: v.id("bill_payments"),
  handler: async (ctx, args) => {
    const { members, expenses } = await loadBillGroup(ctx, args.groupId);
    const payments = await ctx.db
      .query("bill_payments")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const balances = computeBalances(
      members.map((m) => ({ id: m._id })),
      expenses.filter((e) => !e.deleted_at).map(expenseView),
      payments.filter((p) => !p.voided_at).map(paymentView),
    );
    // Recheck in the transaction so concurrent/stale clicks cannot overpay.
    validateRepayment(balances, args);
    return await ctx.db.insert("bill_payments", {
      groupId: args.groupId,
      from_id: args.fromId,
      to_id: args.toId,
      amount_cents: args.amountCents,
      created_at: Date.now(),
    });
  },
});

export const undoPayment = mutation({
  args: { groupId: v.id("bill_groups"), paymentId: v.id("bill_payments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.groupId !== args.groupId)
      throw new Error("Payment not found");
    if (!payment.voided_at)
      await ctx.db.patch(payment._id, { voided_at: Date.now() });
    return null;
  },
});
