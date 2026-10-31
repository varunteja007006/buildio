"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Users } from "lucide-react";
import React from "react";

interface Member {
  id: string;
  name: string;
}

export function ParticipantPicker({
  members,
  selectedIds,
  onChange,
  disabled,
}: {
  members: Member[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}) {
  const toggle = (memberId: string) => {
    const next = new Set(selectedIds);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    onChange(next);
  };

  const label =
    selectedIds.size === members.length
      ? "Everyone"
      : `${selectedIds.size} of ${members.length}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 shrink-0 cursor-pointer gap-1.5"
        >
          <Users className="size-4" />
          <span className="text-xs">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="space-y-1">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={selectedIds.has(member.id)}
                onCheckedChange={() => toggle(member.id)}
              />
              {member.name}
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onChange(new Set(members.map((m) => m.id)))}
          >
            Everyone
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => onChange(new Set())}
          >
            None
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}