"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
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
import { useEffect, useState } from "react";

import { getConvexErrorMessage } from "@/lib/convex-error";
import {
  MAX_FOLDER_DEPTH,
  MAX_NAME_LENGTH,
  type FolderId,
} from "@/lib/folders";

type FolderNameDialogProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  note?: string | null;
};

/** Shared single-name-input dialog used by create and rename. */
function FolderNameDialog({
  title,
  description,
  submitLabel,
  initialName,
  open,
  onOpenChange,
  onSubmit,
  note,
}: FolderNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync the field each time the dialog opens (create starts empty,
  // rename pre-fills the current name).
  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0 || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onOpenChange(false);
    } catch (cause) {
      setError(getConvexErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid gap-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              placeholder="Folder name"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
            />
            {note ? (
              <p className="text-sm text-muted-foreground">{note}</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={name.trim().length === 0 || isSubmitting}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FolderCreateDialog({
  parentId,
  parentDepth,
  open,
  onOpenChange,
}: {
  parentId: FolderId | null;
  parentDepth: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createFolder = useMutation(api.bookFolders.create);
  const atMaxDepth = parentDepth + 1 > MAX_FOLDER_DEPTH;

  return (
    <FolderNameDialog
      title="Add folder"
      description="Create a folder to organize your books."
      submitLabel="Create"
      initialName=""
      open={open}
      onOpenChange={onOpenChange}
      note={
        atMaxDepth
          ? `Maximum nesting depth (${MAX_FOLDER_DEPTH - 1} levels) reached.`
          : null
      }
      onSubmit={async (name) => {
        await createFolder({ name, parentId: parentId ?? undefined });
      }}
    />
  );
}

export function FolderRenameDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: { id: FolderId; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const renameFolder = useMutation(api.bookFolders.rename);

  return (
    <FolderNameDialog
      title="Rename folder"
      description="Choose a new name for this folder."
      submitLabel="Save"
      initialName={folder?.name ?? ""}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={async (name) => {
        if (folder) {
          await renameFolder({ id: folder.id, name });
        }
      }}
    />
  );
}