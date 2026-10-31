"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowRight, HandCoins } from "lucide-react";
import React, { useMemo } from "react";

import {
  computeBalances,
  computeSettlement,
  formatMoney,
} from "@/lib/settlement";

interface Member {
  id: string;
  name: string;
}

interface Expense {
  amountCents: number;
  payerId: string;
  participantIds: string[];
}

export function SettlementCard({
  members,
  expenses,
  currency,
}: {
  members: Member[];
  expenses: Expense[];
  currency: string;
}) {
  const nameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );
  const balances = useMemo(
    () => computeBalances(members, expenses),
    [members, expenses],
  );
  const transfers = useMemo(
    () => computeSettlement(balances),
    [balances],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HandCoins className="size-5" /> How to settle up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {expenses.length === 0 ? (
          <p className="text-muted-foreground">
            Add expenses to see who owes whom.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Transfers</p>
              {transfers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All settled up — nobody owes anybody anything.
                </p>
              ) : (
                <ul className="space-y-2">
                  {transfers.map((transfer) => (
                    <li
                      key={`${transfer.fromId}-${transfer.toId}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {nameById.get(transfer.fromId) ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground">pays</span>
                      <span className="font-mono font-semibold">
                        {formatMoney(transfer.amountCents, currency)}
                      </span>
                      <span className="text-muted-foreground">to</span>
                      <span className="font-medium">
                        {nameById.get(transfer.toId) ?? "Unknown"}
                      </span>
                      <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Net balances</p>
              <ul className="space-y-1.5">
                {balances.map((balance) => (
                  <li
                    key={balance.memberId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{nameById.get(balance.memberId) ?? "Unknown"}</span>
                    <span
                      className={
                        balance.netCents >= 0
                          ? "font-mono text-emerald-600 dark:text-emerald-400"
                          : "font-mono text-red-600 dark:text-red-400"
                      }
                    >
                      {formatMoney(balance.netCents, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}