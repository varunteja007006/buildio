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

export function DeleteTopicDialog({
  topic,
  onOpenChange,
  onDeleted,
}: {
  topic: { id: Id<"book_topics">; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (topicId: Id<"book_topics">) => void;
}) {
  const removeTopic = useMutation(api.bookTopics.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    if (!topic || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await removeTopic({ id: topic.id });
      onDeleted(topic.id);
      handleOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to delete topic",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={topic !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete topic?</AlertDialogTitle>
          <AlertDialogDescription>
            {topic
              ? `"${topic.name}" will be permanently deleted. This cannot be undone.`
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
