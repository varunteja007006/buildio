"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { useMutation } from "convex/react";
import { useState } from "react";

import { getConvexErrorMessage } from "@/lib/convex-error";
import type { FolderId } from "@/lib/folders";

export function FolderDeleteDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: { id: FolderId; name: string; hasChildren: boolean } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const removeFolder = useMutation(api.bookFolders.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    if (!folder || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await removeFolder({ id: folder.id });
      handleOpenChange(false);
    } catch (cause) {
      setError(getConvexErrorMessage(cause));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open && folder !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete folder?</AlertDialogTitle>
          <AlertDialogDescription>
            {folder
              ? `"${folder.name}" will be permanently deleted.${
                  folder.hasChildren
                    ? " Its nested subfolders will also be deleted."
                    : ""
                } This cannot be undone.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              // Keep the dialog open until the mutation settles so errors
              // stay visible.
              event.preventDefault();
              void handleDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}