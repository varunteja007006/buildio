"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

import { ExpenseTrash } from "@/components/expense-trash";
import { GroupHeader } from "@/components/group-header";
import { MemberExpenseCard } from "@/components/member-expense-card";
import { MembersCard } from "@/components/members-card";
import { SettlementCard } from "@/components/settlement-card";
import { TripSummary } from "@/components/trip-summary";

export function GroupView({ groupId }: { groupId: string }) {
  const group = useQuery(api.bills.getGroup, {
    groupId: groupId as Id<"bill_groups">,
  });
  const deleteExpense = useMutation(api.bills.deleteExpense);
  const restoreExpense = useMutation(api.billTrash.restoreExpense);

  if (group === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (group === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Group not found</h1>
        <p className="text-muted-foreground">
          This calculation does not exist (anymore).
        </p>
        <Button asChild>
          <Link href="/">Start a new calculation</Link>
        </Button>
      </div>
    );
  }

  const handleDeleteExpense = (expenseId: string) => {
    const args = {
      groupId: groupId as Id<"bill_groups">,
      expenseId: expenseId as Id<"bill_expenses">,
    };
    deleteExpense(args)
      .then(() =>
        toast.success("Expense moved to deleted expenses", {
          action: {
            label: "Undo",
            onClick: () => {
              restoreExpense(args).catch(() =>
                toast.error(
                  "Could not restore the expense. Try the deleted expenses section.",
                ),
              );
            },
          },
        }),
      )
      .catch((error) => {
        toast.error("Failed to remove the expense");
        console.error(error);
      });
  };

  return (
    <div className="space-y-6">
      <GroupHeader groupId={groupId} name={group.name} />

      <MembersCard groupId={groupId} members={group.members} />

      <TripSummary
        members={group.members}
        expenses={group.expenses}
        payments={group.payments}
        currency={group.currency}
      />

      <SettlementCard
        groupId={groupId}
        name={group.name}
        members={group.members}
        expenses={group.expenses}
        payments={group.payments}
        currency={group.currency}
      />

      <div className="space-y-4">
        <h2 className="sr-only">Expenses per person</h2>
        {group.members.map((member) => (
          <MemberExpenseCard
            key={member.id}
            groupId={groupId}
            member={member}
            members={group.members}
            expenses={group.expenses.filter(
              (expense) => expense.payerId === member.id,
            )}
            currency={group.currency}
            onDeleteExpense={handleDeleteExpense}
          />
        ))}
      </div>

      <ExpenseTrash
        groupId={groupId}
        members={group.members}
        currency={group.currency}
      />
    </div>
  );
}
