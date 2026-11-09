"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
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

export function DeleteBookDialog({
  book,
  onOpenChange,
  onDeleted,
}: {
  book: { id: Id<"books">; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (bookId: Id<"books">) => void;
}) {
  const removeBook = useMutation(api.books.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    if (!book || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await removeBook({ id: book.id });
      onDeleted(book.id);
      handleOpenChange(false);
    } catch (cause) {
      setError(getConvexErrorMessage(cause));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={book !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete book?</AlertDialogTitle>
          <AlertDialogDescription>
            {book
              ? `"${book.title}" and all of its notes will be permanently deleted. This cannot be undone.`
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
