"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { Pencil, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export function GroupHeader({
  groupId,
  name,
}: {
  groupId: string;
  name: string;
}) {
  const router = useRouter();
  const deleteGroup = useMutation(api.bills.deleteGroup);
  const renameGroup = useMutation(api.billEdits.renameGroup);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    try {
      await renameGroup({
        groupId: groupId as Id<"bill_groups">,
        name: trimmed,
      });
      toast.success("Group renamed");
      setRenameOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename the group",
      );
      console.error(error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup({ groupId: groupId as Id<"bill_groups"> });
      toast.success("Group deleted");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete the group");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">{name}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewName(name);
            setRenameOpen(true);
          }}
          className="cursor-pointer"
        >
          <Pencil /> Rename
        </Button>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent>
            <form onSubmit={handleRename} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Rename group</DialogTitle>
              </DialogHeader>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Group name"
                disabled={isRenaming}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isRenaming || !newName.trim()}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="cursor-pointer"
        >
          <Share2 /> Share
        </Button>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this group?</DialogTitle>
              <DialogDescription>
                This permanently removes the group with all its members and
                expenses and repayment records. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
