"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { ParticipantPicker } from "@/components/participant-picker";
import { parseAmountToCents } from "@/lib/settlement";

interface Member {
  id: string;
  name: string;
}

export interface ExpenseFormValues {
  description: string;
  amountCents: number;
  participantIds: Set<string>;
}

/** Add/edit form for a single expense, shared by both flows. */
export function ExpenseForm({
  members,
  currency,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  members: Member[];
  currency: string;
  initialValues: {
    description: string;
    amount: string;
    participantIds: Set<string>;
  };
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(initialValues.description);
  const [amount, setAmount] = useState(initialValues.amount);
  const [participantIds, setParticipantIds] = useState<Set<string>>(
    initialValues.participantIds,
  );

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
    await onSubmit({ description, amountCents, participantIds });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2"
    >
      <Input
        ref={descriptionRef}
        autoFocus
        placeholder="What? e.g. Bus tickets"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            amountRef.current?.focus();
          }
        }}
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
        {submitLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancel"
        onClick={onCancel}
        className="size-8 cursor-pointer text-muted-foreground"
      >
        <X />
      </Button>
    </form>
  );
}