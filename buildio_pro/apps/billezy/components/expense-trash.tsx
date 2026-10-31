"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/settlement";

function DeletedExpenses({
  groupId,
  members,
  currency,
}: {
  groupId: string;
  members: { id: string; name: string }[];
  currency: string;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.billTrash.listExpenses,
    { groupId: groupId as Id<"bill_groups"> },
    { initialNumItems: 20 },
  );
  const restoreExpense = useMutation(api.billTrash.restoreExpense);
  const permanentlyDeleteExpense = useMutation(
    api.billTrash.permanentlyDeleteExpense,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const handleAction = async (expenseId: string, permanent: boolean) => {
    if (
      permanent &&
      !window.confirm("Permanently delete this expense? This cannot be undone.")
    )
      return;
    setBusyId(expenseId);
    try {
      const args = {
        groupId: groupId as Id<"bill_groups">,
        expenseId: expenseId as Id<"bill_expenses">,
      };
      if (permanent) await permanentlyDeleteExpense(args);
      else await restoreExpense(args);
      toast.success(
        permanent ? "Expense permanently deleted" : "Expense restored",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update deleted expense",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">
        Deleted expenses do not count toward trip totals. Restore them here, or
        delete them permanently.
      </p>
      {status === "LoadingFirstPage" ? (
        <p role="status">Loading deleted expenses…</p>
      ) : (
        results.length === 0 && (
          <p className="text-sm text-muted-foreground">No deleted expenses.</p>
        )
      )}
      <ul className="space-y-2">
        {results.map((expense) => (
          <li
            key={expense.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <span className="min-w-0 break-words">
              {expense.description} ·{" "}
              {formatMoney(expense.amountCents, currency)}
              <span className="block text-xs text-muted-foreground">
                Paid by {members.find((m) => m.id === expense.payerId)?.name}
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busyId !== null}
                onClick={() => handleAction(expense.id, false)}
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={busyId !== null}
                onClick={() => handleAction(expense.id, true)}
              >
                Delete permanently
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {status === "CanLoadMore" && (
        <Button variant="outline" onClick={() => loadMore(20)}>
          Load more
        </Button>
      )}
      {status === "LoadingMore" && <p role="status">Loading more…</p>}
    </div>
  );
}

export function ExpenseTrash(props: {
  groupId: string;
  members: { id: string; name: string }[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="rounded-xl border p-4"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium">Deleted expenses</summary>
      {open && <DeletedExpenses {...props} />}
    </details>
  );
}
