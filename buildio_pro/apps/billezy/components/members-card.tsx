"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/games-convex-backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { UserRound } from "lucide-react";
import React, { useState } from "react";
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
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error) {
      toast.error("Failed to add the member");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm"
            >
              <UserRound className="size-4 text-muted-foreground" />
              {member.name}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <Input
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