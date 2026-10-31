"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useMutation } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CURRENCIES = ["$", "€", "£", "₹", "¥"];

export function CreateGroupForm() {
  const router = useRouter();
  const createGroup = useMutation(api.bills.createGroup);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("$");
  const [memberNames, setMemberNames] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current === null) return;
    memberInputRefs.current[pendingFocusIndex.current]?.focus();
    pendingFocusIndex.current = null;
  });

  const setMemberName = (index: number, value: string) => {
    setMemberNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const removeMemberName = (index: number) => {
    setMemberNames((prev) => {
      if (prev.length <= 2) return prev;
      pendingFocusIndex.current = Math.min(index, prev.length - 2);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addMemberName = () => {
    pendingFocusIndex.current = memberNames.length;
    setMemberNames((prev) => [...prev, ""]);
  };

  const advanceToNextMember = (index: number) => {
    const next = memberInputRefs.current[index + 1];
    if (next) {
      next.focus();
    } else {
      pendingFocusIndex.current = index;
      addMemberName();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const members = memberNames.map((n) => n.trim()).filter(Boolean);
    if (!name.trim() || members.length === 0) {
      toast.error("Give the group a name and at least one member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { groupId } = await createGroup({
        name: name.trim(),
        currency,
        memberNames: members,
      });
      router.push(`/group/${groupId}`);
    } catch (error) {
      toast.error("Failed to create the group. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border bg-card p-6 space-y-5 shadow-sm"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="group-name">
          Give it a name!
        </label>
        <Input
          id="group-name"
          placeholder="Eg: Goa Trip 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          How many people are in your group?
        </label>
        <div className="space-y-2">
          {memberNames.map((memberName, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                ref={(el) => {
                  memberInputRefs.current[index] = el;
                }}
                placeholder={`Member ${index + 1} name`}
                value={memberName}
                onChange={(e) => setMemberName(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    advanceToNextMember(index);
                  }
                }}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMemberName(index)}
                disabled={memberNames.length <= 2 || isSubmitting}
                aria-label="Remove member"
                className="text-muted-foreground"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMemberName}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          <Plus /> Add another person
        </Button>
        <p className="text-[0.8rem] text-muted-foreground">
          People can be excluded from single expenses later.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-28" aria-label="Currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          Start new calculation
        </Button>
      </div>
    </form>
  );
}