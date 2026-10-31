import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { sumCents } from "./lib/billMath";

export const expenseShape = v.object({
  id: v.id("bill_expenses"),
  description: v.string(),
  amountCents: v.number(),
  payerId: v.id("bill_members"),
  participantIds: v.array(v.id("bill_members")),
  createdAt: v.number(),
});

export const paymentShape = v.object({
  id: v.id("bill_payments"),
  fromId: v.id("bill_members"),
  toId: v.id("bill_members"),
  amountCents: v.number(),
  createdAt: v.number(),
});

export function paymentView(p: Doc<"bill_payments">) {
  return {
    id: p._id,
    fromId: p.from_id,
    toId: p.to_id,
    amountCents: p.amount_cents,
    createdAt: p.created_at,
  };
}

export function expenseView(e: Doc<"bill_expenses">) {
  return {
    id: e._id,
    description: e.description,
    amountCents: e.amount_cents,
    payerId: e.payer_id,
    participantIds: e.participant_ids,
    createdAt: e.created_at,
  };
}

/** Group links are edit capabilities; verify all referenced records belong to it. */
export async function validateExpense(
  ctx: MutationCtx,
  args: {
    groupId: Id<"bill_groups">;
    description: string;
    amountCents: number;
    payerId: Id<"bill_members">;
    participantIds: Id<"bill_members">[];
  },
  excludeId?: Id<"bill_expenses">,
) {
  if (!args.description.trim()) throw new Error("Description is required");
  if (!Number.isSafeInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error("Amount must be positive, safe integer cents");
  }
  if (
    !args.participantIds.length ||
    new Set(args.participantIds).size !== args.participantIds.length
  ) {
    throw new Error("Pick at least one participant, without duplicates");
  }
  const { members, expenses } = await loadBillGroup(ctx, args.groupId);
  const memberIds = new Set(members.map((m) => m._id));
  if (
    !memberIds.has(args.payerId) ||
    args.participantIds.some((id) => !memberIds.has(id))
  ) {
    throw new Error("Payer and participants must belong to this group");
  }
  sumCents([
    args.amountCents,
    ...expenses
      .filter((e) => !e.deleted_at && e._id !== excludeId)
      .map((e) => e.amount_cents),
  ]);
}

export async function loadBillGroup(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"bill_groups">,
) {
  if (!(await ctx.db.get(groupId))) throw new Error("Group not found");
  const [members, expenses] = await Promise.all([
    ctx.db
      .query("bill_members")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect(),
    ctx.db
      .query("bill_expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect(),
  ]);
  return { members, expenses };
}
