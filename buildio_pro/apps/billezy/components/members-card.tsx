"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { Check, Pencil, UserRound, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
}

export function MembersCard({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const addMember = useMutation(api.bills.addMember);
  const renameMember = useMutation(api.billEdits.renameMember);
  const removeMember = useMutation(api.billEdits.removeMember);

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await addMember({
        groupId: groupId as Id<"bill_groups">,
        name: trimmed,
      });
      setName("");
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add the member",
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditingName(member.name);
  };

  const saveEdit = async () => {
    if (isBusy || !editingId) return;
    const trimmed = editingName.trim();
    const previous = members.find((m) => m.id === editingId);
    if (!trimmed || trimmed === previous?.name) {
      setEditingId(null);
      return;
    }
    setIsBusy(true);
    try {
      await renameMember({
        memberId: editingId as Id<"bill_members">,
        name: trimmed,
      });
      setEditingId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename the member",
      );
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async (member: Member) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await removeMember({ memberId: member.id as Id<"bill_members"> });
      toast.success(`${member.name} removed`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove the member",
      );
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="flex flex-wrap gap-2">
          {members.map((member) =>
            editingId === member.id ? (
              <li
                key={member.id}
                className="flex items-center gap-1 rounded-full border bg-muted/40 py-1 pl-3 pr-1"
              >
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEdit();
                    }
                    if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  disabled={isBusy}
                  aria-label="Member name"
                  className="h-6 w-28 rounded-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Save name"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={saveEdit}
                  disabled={isBusy}
                  className="size-6 cursor-pointer text-muted-foreground"
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Cancel renaming"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setEditingId(null)}
                  className="size-6 cursor-pointer text-muted-foreground"
                >
                  <X />
                </Button>
              </li>
            ) : (
              <li
                key={member.id}
                className="group flex items-center gap-1 rounded-full border bg-muted/40 py-1.5 pl-3 pr-1.5 text-sm"
              >
                <UserRound className="size-4 text-muted-foreground" />
                {member.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Rename ${member.name}`}
                  onClick={() => startEdit(member)}
                  disabled={isBusy}
                  className="size-6 cursor-pointer text-muted-foreground opacity-60 hover:text-foreground group-hover:opacity-100"
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => handleRemove(member)}
                  disabled={isBusy}
                  className="size-6 cursor-pointer text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"
                >
                  <X />
                </Button>
              </li>
            ),
          )}
        </ul>
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Add a person…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !name.trim()}
            className="cursor-pointer"
          >
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}