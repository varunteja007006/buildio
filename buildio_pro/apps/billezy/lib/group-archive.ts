import type { Doc } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import {
  computeMemberSummary,
  computeSettlement,
  sumCents,
} from "@workspace/games-convex-backend/convex/lib/billMath.ts";

import { formatMoney } from "./money.ts";

export interface GroupArchiveData {
  group: Doc<"bill_groups">;
  members: Doc<"bill_members">[];
  expenses: Doc<"bill_expenses">[];
  payments: Doc<"bill_payments">[];
  expiresAt: number;
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function table(headers: string[], rows: (string | number)[][]): string {
  return `<div class="table"><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/** Deleted expenses and undone repayments never count toward balances. */
function activeRecords(data: GroupArchiveData) {
  return {
    members: data.members.map((member) => ({ id: member._id })),
    expenses: data.expenses
      .filter((expense) => expense.deleted_at === undefined)
      .map((expense) => ({
        amountCents: expense.amount_cents,
        payerId: expense.payer_id,
        participantIds: expense.participant_ids,
      })),
    payments: data.payments
      .filter((payment) => payment.voided_at === undefined)
      .map((payment) => ({
        fromId: payment.from_id,
        toId: payment.to_id,
        amountCents: payment.amount_cents,
      })),
  };
}

interface ActiveSummary {
  totalActiveCents: number;
  summaries: ReturnType<typeof computeMemberSummary>;
  transfers: ReturnType<typeof computeSettlement>;
}

/**
 * Legacy records can be inconsistent; export the raw data regardless and only
 * omit the derived summary when the shared math rejects it.
 */
function summarize(data: GroupArchiveData): ActiveSummary | null {
  try {
    const { members, expenses, payments } = activeRecords(data);
    const summaries = computeMemberSummary(members, expenses, payments);
    const transfers = computeSettlement(
      summaries.map(({ memberId, netCents }) => ({ memberId, netCents })),
    );
    return {
      totalActiveCents: sumCents(
        expenses.map((expense) => expense.amountCents),
      ),
      summaries,
      transfers,
    };
  } catch {
    return null;
  }
}

function settlementLabel(
  netCents: number,
  money: (cents: number) => string,
): string {
  if (netCents > 0) return `Still receives ${money(netCents)}`;
  if (netCents < 0) return `Still owes ${money(-netCents)}`;
  return "Settled";
}

function renderSummary(
  summary: ActiveSummary | null,
  name: (id: Doc<"bill_members">["_id"]) => string,
  money: (cents: number) => string,
): string {
  if (!summary) {
    return `<p>Financial summary is unavailable for this archive: some historical records are incomplete or inconsistent. Every raw record is still exported below.</p>`;
  }
  const rows = summary.summaries.map((entry) => [
    name(entry.memberId as Doc<"bill_members">["_id"]),
    money(entry.paidCents),
    money(entry.shareCents),
    money(entry.sentCents),
    money(entry.receivedCents),
    settlementLabel(entry.netCents, money),
  ]);
  const transfers =
    summary.transfers.length === 0
      ? "<p>All active balances are settled; nothing remains to transfer.</p>"
      : `<h3>Remaining settlement transfers</h3>${table(
          ["From", "To", "Amount"],
          summary.transfers.map((transfer) => [
            name(transfer.fromId as Doc<"bill_members">["_id"]),
            name(transfer.toId as Doc<"bill_members">["_id"]),
            money(transfer.amountCents),
          ]),
        )}`;
  return `<p>Total active expenses: ${escapeHtml(money(summary.totalActiveCents))}</p>${table(
    [
      "Member",
      "Paid",
      "Share",
      "Repayments sent",
      "Repayments received",
      "Settlement",
    ],
    rows,
  )}${transfers}`;
}

/** No scripts, remote assets, or live links: this archive remains readable offline. */
export function renderGroupArchive(
  data: GroupArchiveData,
  exportedAt: number,
): string {
  const { group, members, expenses, payments } = data;
  const names = new Map(members.map((member) => [member._id, member.name]));
  const name = (id: Doc<"bill_members">["_id"]) =>
    names.get(id) ?? `Unknown member (${id})`;
  const date = (timestamp: number) => new Date(timestamp).toISOString();
  const money = (cents: number) => formatMoney(cents, group.currency);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${escapeHtml(group.name)} — Billezy archive</title>
<style>body{font:16px system-ui,sans-serif;line-height:1.5;max-width:70rem;margin:2rem auto;padding:0 1rem;color:#111;background:#fff}h1{overflow-wrap:anywhere}.table{overflow:auto}table{border-collapse:collapse;width:100%;font-size:.875rem}th,td{border:1px solid #ccc;padding:.5rem;text-align:left;vertical-align:top;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.75rem}small{color:#444}@media print{body{max-width:none;margin:0}details{display:block}.table{overflow:visible}}</style>
</head><body>
<h1>${escapeHtml(group.name)}</h1>
<p>Billezy archive · Currency: ${escapeHtml(group.currency)}</p>
<p>Created: ${date(group.created_at)}<br>Exported: ${date(exportedAt)}<br>Scheduled deletion: ${date(data.expiresAt)}</p>
<p>This is an offline snapshot, not a live bill or proof of payment. Repayments are manually recorded. Dates are UTC. Deleted expenses and undone repayments are marked below; they do not count toward current balances.</p>
<h2>Balances from active records</h2>
${renderSummary(summarize(data), name, money)}
<h2>Members</h2>
${table(
  ["Name", "Member ID", "Added"],
  members.map((member) => [member.name, member._id, date(member.created_at)]),
)}
<h2>All expenses</h2>
${table(
  ["Description", "Amount", "Paid by", "Shared by", "Created", "Status"],
  expenses.map((expense) => [
    expense.description,
    money(expense.amount_cents),
    name(expense.payer_id),
    expense.participant_ids.map(name).join(", "),
    date(expense.created_at),
    expense.deleted_at === undefined
      ? "Active"
      : `Deleted ${date(expense.deleted_at)}`,
  ]),
)}
<h2>All repayment records</h2>
${table(
  ["From", "To", "Amount", "Recorded", "Status"],
  payments.map((payment) => [
    name(payment.from_id),
    name(payment.to_id),
    money(payment.amount_cents),
    date(payment.created_at),
    payment.voided_at === undefined
      ? "Recorded"
      : `Undone ${date(payment.voided_at)}`,
  ]),
)}
<h2>Complete data (JSON)</h2>
<p>Includes original IDs, exact integer cents, timestamps, deleted expenses, and undone repayments. Permanently deleted records cannot be recovered.</p>
<pre>${escapeHtml(JSON.stringify({ ...data, exportedAt }, null, 2))}</pre>
</body></html>`;
}
