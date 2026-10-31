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
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { Plus, Tag, Trash2, UserRound, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { ParticipantPicker } from "@/components/participant-picker";
import { formatMoney, parseAmountToCents } from "@/lib/settlement";

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
  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [participantIds, setParticipantIds] = useState<Set<string>>(
    () => new Set(members.map((m) => m.id)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  const openForm = () => {
    setIsAdding(true);
    setParticipantIds(new Set(members.map((m) => m.id)));
    requestAnimationFrame(() => descriptionRef.current?.focus());
  };

  const resetForm = () => {
    setIsAdding(false);
    setDescription("");
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountToCents(amount);
    if (!description.trim()) {
      descriptionRef.current?.focus();
      return;
    }
    if (Number.isNaN(amountCents)) {
      amountRef.current?.focus();
      return;
    }
    if (participantIds.size === 0) {
      toast.error("Pick who shares this expense.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        groupId: groupId as Id<"bill_groups">,
        description: description.trim(),
        amountCents,
        payerId: member.id as Id<"bill_members">,
        participantIds: [...participantIds] as Id<"bill_members">[],
      });
      resetForm();
    } catch (error) {
      toast.error("Failed to add the expense");
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
              aria-label={`Delete ${expense.description}`}
              onClick={() => onDeleteExpense(expense.id)}
              className="size-8 shrink-0 cursor-pointer text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        {isAdding ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2"
          >
            <Input
              ref={descriptionRef}
              placeholder="What? e.g. Bus tickets"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="min-w-32 flex-1"
              enterKeyHint="next"
            />
            <Input
              ref={amountRef}
              inputMode="decimal"
              placeholder={currency === "₹" ? "Amount ₹" : `Amount ${currency}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              className="w-28 font-mono"
            />
            <ParticipantPicker
              members={members}
              selectedIds={participantIds}
              onChange={setParticipantIds}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cancel"
              onClick={resetForm}
              className="size-8 cursor-pointer text-muted-foreground"
            >
              <X />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={openForm}
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="size-4" /> add expense
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ParticipantShare({
  count,
  total,
  names,
}: {
  count: number;
  total: number;
  names: string;
}) {
  if (count === total) {
    return (
      <span
        title={`Shared by everyone (${names})`}
        className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"
      >
        <UserRound className="size-3.5" />
        all
      </span>
    );
  }
  return (
    <span
      title={`Shared by ${names}`}
      className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"
    >
      <UserRound className="size-3.5" />
      {count}
    </span>
  );
}