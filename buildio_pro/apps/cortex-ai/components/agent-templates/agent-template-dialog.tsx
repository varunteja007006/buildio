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
import { Textarea } from "@workspace/ui/components/textarea";
import { useRef } from "react";

import type { AgentInstructionTemplate } from "@/api/agent-templates/types";
import { CharCount } from "@/components/char-count";
import {
  DESCRIPTION_MAX_LENGTH,
  INSTRUCTIONS_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";

export type AgentTemplateFormState = {
  name: string;
  description: string;
  body: string;
};

export const emptyAgentTemplateForm: AgentTemplateFormState = {
  name: "",
  description: "",
  body: "",
};

export function agentTemplateFormFromTemplate(
  template: AgentInstructionTemplate,
): AgentTemplateFormState {
  return {
    name: template.name,
    description: template.description ?? "",
    body: template.body,
  };
}

type AgentTemplateDialogProps = {
  open: boolean;
  editing: AgentInstructionTemplate | null;
  form: AgentTemplateFormState;
  error: string | null;
  pending: boolean;
  onChange: (update: Partial<AgentTemplateFormState>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AgentTemplateDialog({
  open,
  editing,
  form,
  error,
  pending,
  onChange,
  onSave,
  onClose,
}: AgentTemplateDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>
            {editing ? "Edit instruction template" : "New instruction template"}
          </DialogTitle>
          <DialogDescription>
            Reusable instructions. Applying a template copies its text into an
            agent.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="agent-template-name">Name</Label>
            <Input
              id="agent-template-name"
              value={form.name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(event) => onChange({ name: event.target.value })}
            />
            <CharCount value={form.name} maxLength={NAME_MAX_LENGTH} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-template-description">Description</Label>
            <Input
              id="agent-template-description"
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
            <Label htmlFor="agent-template-body">Instructions</Label>
            <Textarea
              id="agent-template-body"
              className="scrollbar-elegant max-h-64 min-h-40 resize-y overflow-auto font-mono text-sm"
              rows={8}
              value={form.body}
              maxLength={INSTRUCTIONS_MAX_LENGTH}
              onChange={(event) => onChange({ body: event.target.value })}
            />
            <CharCount
              value={form.body}
              maxLength={INSTRUCTIONS_MAX_LENGTH}
              className="text-right"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving..." : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}