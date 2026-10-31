"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useMutation } from "convex/react";
import { Pencil, Plus, Tag, Trash2, UserRound } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { ExpenseForm } from "@/components/expense-form";
import { ParticipantShare } from "@/components/participant-share";
import { formatMoney } from "@/lib/settlement";

interface Member {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amountCents: number;
  payerId: string;
  participantIds: string[];
}

export function MemberExpenseCard({
  groupId,
  member,
  members,
  expenses,
  currency,
  onDeleteExpense,
}: {
  groupId: string;
  member: Member;
  members: Member[];
  expenses: Expense[];
  currency: string;
  onDeleteExpense: (expenseId: string) => void;
}) {
  const addExpense = useMutation(api.bills.addExpense);
  const updateExpense = useMutation(api.billEdits.updateExpense);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  const openForm = (expense?: Expense) => {
    setEditingExpense(expense ?? null);
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingExpense(null);
    requestAnimationFrame(() => addButtonRef.current?.focus());
  };

  const handleSubmit = async (values: {
    description: string;
    amountCents: number;
    participantIds: Set<string>;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateExpense({
          expenseId: editingExpense.id as Id<"bill_expenses">,
          description: values.description,
          amountCents: values.amountCents,
          participantIds: [...values.participantIds] as Id<"bill_members">[],
        });
        toast.success("Expense updated");
      } else {
        await addExpense({
          groupId: groupId as Id<"bill_groups">,
          description: values.description,
          amountCents: values.amountCents,
          payerId: member.id as Id<"bill_members">,
          participantIds: [...values.participantIds] as Id<"bill_members">[],
        });
      }
      closeForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save the expense",
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberNameById = new Map(members.map((m) => [m.id, m.name]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <UserRound className="size-5 text-muted-foreground" />
            {member.name}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-muted-foreground">
            <Tag className="size-4" />
            {formatMoney(totalCents, currency)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
          >
            <p className="min-w-0 flex-1 truncate text-sm">
              {expense.description}
            </p>
            <p className="shrink-0 font-mono text-sm">
              {formatMoney(expense.amountCents, currency)}
            </p>
            <ParticipantShare
              count={expense.participantIds.length}
              total={members.length}
              names={expense.participantIds
                .map((id) => memberNameById.get(id))
                .filter(Boolean)
                .join(", ")}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${expense.description}`}
              onClick={() => openForm(expense)}
              className="size-8 shrink-0 cursor-pointer text-muted-foreground opacity-60 hover:text-foreground group-hover:opacity-100"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${expense.description}`}
              onClick={() => onDeleteExpense(expense.id)}
              className="size-8 shrink-0 cursor-pointer text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        {isAdding ? (
          <ExpenseForm
            key={editingExpense?.id ?? "new"}
            members={members}
            currency={currency}
            initialValues={
              editingExpense
                ? {
                    description: editingExpense.description,
                    amount: String(editingExpense.amountCents / 100),
                    participantIds: new Set(editingExpense.participantIds),
                  }
                : {
                    description: "",
                    amount: "",
                    participantIds: new Set(members.map((m) => m.id)),
                  }
            }
            submitLabel={editingExpense ? "Save" : "Add"}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        ) : (
          <button
            ref={addButtonRef}
            type="button"
            onClick={() => openForm()}
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="size-4" /> add expense
          </button>
        )}
      </CardContent>
    </Card>
  );
}