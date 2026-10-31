"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import {
  computeMemberSummary,
  formatMoney,
  splitExpense,
  sumCents,
} from "@/lib/settlement";
import type { Expense, SettlementTransfer } from "@/lib/settlement";

export function TripSummary({
  members,
  expenses,
  payments,
  currency,
}: {
  members: { id: string; name: string }[];
  expenses: (Expense & { id: string; description: string })[];
  payments: SettlementTransfer[];
  currency: string;
}) {
  const summaries = computeMemberSummary(members, expenses, payments);
  const money = (cents: number) => formatMoney(cents, currency);
  const shares = expenses.map((expense) => ({
    expense,
    shares: splitExpense(members, expense),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip summary</CardTitle>
        <p className="text-3xl font-bold font-mono">
          {money(sumCents(expenses.map((e) => e.amountCents)))}
        </p>
        <p className="text-sm text-muted-foreground">
          Total spent · {members.length} people · {expenses.length} expenses
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Already paid means expenses paid to shops, restaurants, etc. Your
          share is your actual trip cost. Repayments only change what remains to
          settle.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {summaries.map((summary) => (
            <section
              key={summary.memberId}
              className="min-w-0 rounded-lg border p-4 space-y-3"
            >
              <h3 className="font-semibold break-words">
                {members.find((m) => m.id === summary.memberId)?.name}
              </h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt>Already paid</dt>
                  <dd className="font-mono">{money(summary.paidCents)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Your share</dt>
                  <dd className="font-mono font-semibold">
                    {money(summary.shareCents)}
                  </dd>
                </div>
                {(summary.sentCents > 0 || summary.receivedCents > 0) && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt>Repayments sent</dt>
                      <dd className="font-mono">{money(summary.sentCents)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Repayments received</dt>
                      <dd className="font-mono">
                        {money(summary.receivedCents)}
                      </dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-2 border-t pt-2">
                  <dt>
                    {summary.netCents > 0
                      ? "Still receives"
                      : summary.netCents < 0
                        ? "Still owes"
                        : "Settlement"}
                  </dt>
                  <dd className="font-mono font-semibold">
                    {summary.netCents === 0
                      ? "Settled"
                      : money(Math.abs(summary.netCents))}
                  </dd>
                </div>
              </dl>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Why is this my share?
                </summary>
                <ul className="mt-2 space-y-2">
                  {shares.flatMap(({ expense, shares: expenseShares }) => {
                    const share = expenseShares.find(
                      (s) => s.memberId === summary.memberId,
                    );
                    return share
                      ? [
                          <li
                            key={expense.id}
                            className="flex justify-between gap-2"
                          >
                            <span className="min-w-0 break-words">
                              {expense.description}
                              <span className="block text-xs text-muted-foreground">
                                Shared by {expenseShares.length} · paid by{" "}
                                {
                                  members.find((m) => m.id === expense.payerId)
                                    ?.name
                                }
                              </span>
                            </span>
                            <span className="shrink-0 font-mono">
                              {money(share.amountCents)}
                            </span>
                          </li>,
                        ]
                      : [];
                  })}
                </ul>
                {summary.shareCents === 0 && (
                  <p className="mt-2 text-muted-foreground">
                    No cost allocated yet.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Leftover cents go to the first selected participants.
                </p>
              </details>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
