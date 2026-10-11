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
import { useState } from "react";

import { useCreateTopic } from "@/api/topics/query";
import { CharCount } from "@/components/char-count";

const MAX_NAME_LENGTH = 150;

interface NewTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTopicDialog({ open, onOpenChange }: NewTopicDialogProps) {
  const [name, setName] = useState("");
  const createTopic = useCreateTopic();

  const handleSubmit = () => {
    if (!name.trim()) return;
    createTopic.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New topic</DialogTitle>
          <DialogDescription>
            Topics are top-level categories that organize folders and documents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="topic-name">Name</Label>
          <Input
            id="topic-name"
            placeholder="e.g. Horror"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <CharCount value={name} maxLength={MAX_NAME_LENGTH} />
          {createTopic.isError && (
            <p className="text-xs text-destructive">
              {createTopic.error?.message ?? "Could not create topic."}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createTopic.isPending}
          >
            {createTopic.isPending ? "Creating…" : "Create topic"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
