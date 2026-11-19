"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import React from "react";

import { UserRegistration } from "./user-registration";

export function UserRegistrationDialog({
  defaultOpen = false,
  askRole = false,
}: Readonly<{
  defaultOpen?: boolean;
  /** Ask for the participant role during registration (poker planner only). */
  askRole?: boolean;
}>) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const onSuccess = () => setOpen(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen, details) => {
        // Escape must not dismiss the registration dialog.
        if (!nextOpen && details.reason === "escape-key") {
          details.cancel();
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle></AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <UserRegistration onSuccess={onSuccess} askRole={askRole} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
