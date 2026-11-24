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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useMutation } from "convex/react";
import { Copy, HandCoins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  PaymentDetailsMember,
  SavePaymentDetails,
} from "@/components/member-payment-details";
import { SettlementTransferRow } from "@/components/settlement-transfer-row";
import {
  computeBalances,
  computeSettlement,
  formatMoney,
  sumCents,
} from "@/lib/settlement";
import type { Expense, SettlementTransfer } from "@/lib/settlement";

export interface Payment extends SettlementTransfer {
  id: string;
  createdAt: number;
}

export function SettlementCard({
  groupId,
  name,
  members,
  expenses,
  payments,
  currency,
  onSavePaymentDetails,
}: {
  groupId: string;
  name: string;
  members: PaymentDetailsMember[];
  expenses: Expense[];
  payments: Payment[];
  currency: string;
  onSavePaymentDetails: SavePaymentDetails;
}) {
  const recordPayment = useMutation(api.billPayments.recordPayment);
  const undoPayment = useMutation(api.billPayments.undoPayment);
  const [pending, setPending] = useState<SettlementTransfer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const memberById = new Map<string, PaymentDetailsMember>(
    members.map((member) => [member.id, member]),
  );
  const balances = computeBalances(members, expenses, payments);
  const transfers = computeSettlement(balances);
  const describe = (t: SettlementTransfer) =>
    `${memberById.get(t.fromId)?.name} → ${memberById.get(t.toId)?.name}: ${formatMoney(t.amountCents, currency)}`;

  const copySummary = async () => {
    const lines = [
      name,
      `Total trip cost: ${formatMoney(sumCents(expenses.map((e) => e.amountCents)), currency)}`,
      "",
      "Remaining transfers:",
      ...transfers.map(describe),
    ];
    if (!transfers.length) lines.push("All settled up.");
    if (payments.length)
      lines.push(
        "",
        "Manually recorded repayments:",
        ...payments.map(describe),
      );
    lines.push(
      "",
      "Follow this full list; don't mix payment lists from different apps.",
      window.location.href,
    );
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Settlement summary copied");
    } catch {
      toast.error(
        "Could not copy the summary. Please check clipboard permissions.",
      );
    }
  };

  const savePayment = async () => {
    if (!pending || isSaving) return;
    setIsSaving(true);
    try {
      await recordPayment({
        groupId: groupId as Id<"bill_groups">,
        fromId: pending.fromId as Id<"bill_members">,
        toId: pending.toId as Id<"bill_members">,
        amountCents: pending.amountCents,
      });
      setPending(null);
      toast.success("Payment recorded. No money was moved by Billezy.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const undo = async (paymentId: string) => {
    setUndoingId(paymentId);
    try {
      await undoPayment({
        groupId: groupId as Id<"bill_groups">,
        paymentId: paymentId as Id<"bill_payments">,
      });
      toast.success("Payment record undone");
    } catch {
      toast.error("Could not undo the payment record");
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <HandCoins className="size-5" /> How to settle up
        </CardTitle>
        <Button variant="outline" size="sm" onClick={copySummary}>
          <Copy /> Copy summary
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <section className="space-y-2" aria-label="Remaining transfers">
          <h3 className="text-sm font-medium">Remaining transfers</h3>
          {transfers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Pay outside Billezy first, then record it as paid.
            </p>
          )}
          {!transfers.length ? (
            <p className="text-sm text-muted-foreground">
              {!expenses.length && !payments.length
                ? "Add expenses to see who owes whom."
                : "All settled up — nobody owes anybody anything."}
            </p>
          ) : (
            <ul className="space-y-2">
              {transfers.map((transfer) => {
                const payer = memberById.get(transfer.fromId);
                const recipient = memberById.get(transfer.toId);
                if (!payer || !recipient) return null;
                return (
                  <SettlementTransferRow
                    key={`${transfer.fromId}-${transfer.toId}`}
                    payerName={payer.name}
                    recipient={recipient}
                    amount={formatMoney(transfer.amountCents, currency)}
                    onSavePaymentDetails={onSavePaymentDetails}
                    onRecord={() => setPending(transfer)}
                  />
                );
              })}
            </ul>
          )}
        </section>
        <p className="text-sm text-muted-foreground">
          Anyone with this link can record or undo repayments. These records are
          manually entered and unverified. Editing or deleting expenses
          recalculates what’s owed and keeps past repayment records.
        </p>
        {payments.length > 0 && (
          <section className="space-y-2" aria-label="Recorded repayments">
            <h3 className="text-sm font-medium">
              Manually recorded repayments
            </h3>
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <span>
                    {describe(payment)}
                    <span className="block text-xs text-muted-foreground">
                      Recorded {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={undoingId !== null}
                    onClick={() => undo(payment.id)}
                    aria-label={`Undo payment ${describe(payment)}`}
                  >
                    Undo record
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record this repayment?</DialogTitle>
            <DialogDescription>
              Only record a payment that has already happened. This does not
              send money or verify receipt.
            </DialogDescription>
          </DialogHeader>
          {pending && <p className="font-medium">{describe(pending)}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={savePayment} disabled={isSaving}>
              Confirm payment record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
