"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";

import { useCreateFolder } from "@/api/folders/query";
import type { Folder } from "@/api/folders/types";
import type { Topic } from "@/api/topics/types";
import { CharCount } from "@/components/char-count";

const MAX_NAME_LENGTH = 150;

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: Topic[];
  /** When set, the folder is created inside this parent (topic is inherited) */
  parentFolder?: Folder | null;
  /** Preselect a topic when creating a top-level folder (e.g. from a topic row) */
  defaultTopicId?: string | null;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  topics,
  parentFolder,
  defaultTopicId,
}: NewFolderDialogProps) {
  const [topicId, setTopicId] = useState(
    parentFolder?.topicId ?? defaultTopicId ?? "",
  );
  const [name, setName] = useState("");
  const createFolder = useCreateFolder();

  const handleSubmit = () => {
    if (!name.trim() || !topicId) return;
    createFolder.mutate(
      {
        topicId,
        name: name.trim(),
        parentFolderId: parentFolder?.id ?? null,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            Documents are uploaded into folders inside a topic.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {parentFolder ? (
            <>
              <Label htmlFor="folder-parent">Parent folder</Label>
              <Input
                id="folder-parent"
                value={parentFolder.name}
                readOnly
                disabled
              />
            </>
          ) : (
            <>
              <Label htmlFor="folder-topic">Topic</Label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger id="folder-topic" className="w-full">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Label htmlFor="folder-name">Name</Label>
          <Input
            id="folder-name"
            placeholder="e.g. Drafts"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <CharCount value={name} maxLength={MAX_NAME_LENGTH} />
          {createFolder.isError && (
            <p className="text-xs text-destructive">
              {createFolder.error?.message ?? "Could not create folder."}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !topicId || createFolder.isPending}
          >
            {createFolder.isPending ? "Creating…" : "Create folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
