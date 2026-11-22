"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useId, useRef, useState, type FormEvent, type RefObject } from "react";

import { displayNameSchema } from "../lib/validators";

export function RenameUserDialog({
  open,
  onClose,
  username,
  token,
  menuTriggerRef,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  username: string;
  token: string;
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
}>) {
  const renameUser = useMutation(api.user.renameUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setDraft(null);
    setError("");
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const parsed = displayNameSchema.safeParse(draft ?? username);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Enter a valid display name.",
      );
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    setError("");
    try {
      await renameUser({ token, name: parsed.data });
      close();
    } catch (failure) {
      setError(
        failure instanceof ConvexError && typeof failure.data === "string"
          ? failure.data
          : "Could not update your display name. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saving) close();
      }}
    >
      <DialogContent
        initialFocus={inputRef}
        finalFocus={menuTriggerRef}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Change display name</DialogTitle>
          <DialogDescription>
            Your new name appears in every room that uses this guest profile.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor={inputId}>Display name</Label>
            <Input
              ref={inputRef}
              id={inputId}
              value={draft ?? username}
              readOnly={saving}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
              }}
            />
            {error && (
              <p id={errorId} role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
