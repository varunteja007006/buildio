"use client";

import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Textarea } from "@workspace/ui/components/textarea";
import { Copy, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface PaymentDetailsMember {
  id: Id<"bill_members">;
  name: string;
  paymentDetails?: string;
}

export type SavePaymentDetails = (
  memberId: Id<"bill_members">,
  details: string,
) => Promise<null>;

export function MemberPaymentDetails({
  member,
  onSave,
}: {
  member: PaymentDetailsMember;
  onSave: SavePaymentDetails;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const details = member.paymentDetails;
  const label = `Payment details for ${member.name}`;

  async function save(value: string) {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(member.id, value);
      setOpen(false);
      toast.success(
        value ? "Payment details saved" : "Payment details removed",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save payment details",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Payment details copied");
    } catch {
      toast.error(
        "Could not copy payment details. Select the text to copy it.",
      );
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setEditing(false);
          setDraft(details ?? "");
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label={label}
          title={label}
        >
          <QrCode aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={label} className="space-y-3">
        <PopoverTitle className="break-words text-sm">{label}</PopoverTitle>
        {details && !editing ? (
          <>
            <p className="max-h-40 overflow-y-auto rounded-md bg-muted p-2 text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
              {details}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(details);
                  setEditing(true);
                }}
              >
                Edit
              </Button>
              <Button type="button" size="sm" onClick={() => copy(details)}>
                <Copy aria-hidden="true" /> Copy
              </Button>
            </div>
          </>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const value = draft.trim();
              if (value) void save(value);
            }}
          >
            <Textarea
              aria-label={label}
              placeholder="UPI ID or payment link"
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={saving}
              className="max-h-40"
            />
            <p className="text-xs text-muted-foreground">
              Anyone with the group link can view and edit these details.
            </p>
            <div className="flex justify-end gap-2">
              {details && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => save("")}
                >
                  Remove
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={saving || !draft.trim()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
