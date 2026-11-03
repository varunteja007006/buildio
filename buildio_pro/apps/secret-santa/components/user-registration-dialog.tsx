"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import React from "react";

import { UserRegistration } from "@/components/user-registration";

export function UserRegistrationDialog({
  defaultOpen = false,
}: Readonly<{
  defaultOpen?: boolean;
}>) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const onSuccess = () => setOpen(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle></AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <UserRegistration onSuccess={onSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
