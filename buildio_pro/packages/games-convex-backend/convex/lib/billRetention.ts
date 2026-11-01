import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Six calendar months, clamped to the last day of the target month (UTC). */
export function billExpiresAt(createdAt: number): number {
  const date = new Date(createdAt);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

/** Delete at most 100 children per transaction, including trash and voided payments. */
export async function purgeBillRecordsBatch(
  ctx: MutationCtx,
  groupId: Id<"bill_groups">,
): Promise<boolean> {
  let remaining = 100;
  for (const table of [
    "bill_expenses",
    "bill_payments",
    "bill_members",
  ] as const) {
    const records = await ctx.db
      .query(table)
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .take(remaining);
    for (const record of records) await ctx.db.delete(record._id);
    remaining -= records.length;
    if (remaining === 0) return false;
  }
  return true;
}
