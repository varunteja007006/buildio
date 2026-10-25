"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Toolbox } from "@/api/toolboxes/types";
import { CharCount } from "@/components/char-count";
import { toolCatalog } from "@/lib/agents/tool-catalog";
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from "@/lib/text-limits";

export type ToolboxFormState = {
  name: string;
  description: string;
  toolKeys: string[];
};

export const emptyToolboxForm: ToolboxFormState = {
  name: "",
  description: "",
  toolKeys: [],
};

export function toolboxFormFromToolbox(toolbox: Toolbox): ToolboxFormState {
  return {
    name: toolbox.name,
    description: toolbox.description ?? "",
    toolKeys: toolbox.toolKeys ?? [],
  };
}

type ToolboxDialogProps = {
  open: boolean;
  editing: Toolbox | null;
  form: ToolboxFormState;
  error: string | null;
  pending: boolean;
  onChange: (update: Partial<ToolboxFormState>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ToolboxDialog({
  open,
  editing,
  form,
  error,
  pending,
  onChange,
  onSave,
  onClose,
}: ToolboxDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  // Reset the tool search when the dialog closes so reopening starts clean.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const visibleTools = toolCatalog.filter((entry) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q)
    );
  });

  const toggleTool = (toolKey: string, checked: boolean) => {
    onChange({
      toolKeys: checked
        ? [...form.toolKeys, toolKey]
        : form.toolKeys.filter((key) => key !== toolKey),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>
            {editing ? "Edit toolbox" : "New toolbox"}
          </DialogTitle>
          <DialogDescription>
            Group tools so agents can attach them as one unit.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="toolbox-name">Name</Label>
            <Input
              id="toolbox-name"
              value={form.name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(event) => onChange({ name: event.target.value })}
            />
            <CharCount value={form.name} maxLength={NAME_MAX_LENGTH} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="toolbox-description">Description</Label>
            <Input
              id="toolbox-description"
              value={form.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
            <CharCount
              value={form.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Tools in toolbox</Label>
              <span className="text-xs text-muted-foreground">
                {form.toolKeys.length} selected
              </span>
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools…"
                className="pl-8"
              />
            </div>
            <div className="scrollbar-elegant grid max-h-48 gap-2 overflow-y-auto">
              {visibleTools.map((entry) => (
                <label
                  key={entry.key}
                  htmlFor={`toolbox-tool-${entry.key}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    id={`toolbox-tool-${entry.key}`}
                    className="mt-0.5"
                    checked={form.toolKeys.includes(entry.key)}
                    onCheckedChange={(checked) =>
                      toggleTool(entry.key, checked === true)
                    }
                  />
                  <span className="grid gap-0.5">
                    <span className="text-sm leading-5 font-medium">
                      {entry.name}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {entry.description}
                    </span>
                  </span>
                </label>
              ))}
              {visibleTools.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No tools match “{query.trim()}”.
                </p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving..." : "Save toolbox"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}