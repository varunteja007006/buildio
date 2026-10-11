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

import type { AgentDetail } from "@/api/agents/types";
import { AgentToolPicker } from "@/components/agents/agent-tool-picker";
import { AgentTopicPicker } from "@/components/agents/agent-topic-picker";
import {
  DESCRIPTION_MAX_LENGTH,
  INSTRUCTIONS_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from "@/lib/text-limits";

export type AgentFormState = {
  name: string;
  description: string;
  instructions: string;
  topicIds: string[];
  toolKeys: string[];
  toolboxIds: string[];
};

export const emptyAgentForm: AgentFormState = {
  name: "",
  description: "",
  instructions: "",
  topicIds: [],
  toolKeys: [],
  toolboxIds: [],
};

export function agentFormFromDetail(detail: AgentDetail): AgentFormState {
  return {
    name: detail.agent.name,
    description: detail.agent.description ?? "",
    instructions: detail.agent.instructions ?? "",
    topicIds: detail.topics.map((topic) => topic.id),
    toolKeys: detail.tools,
    toolboxIds: detail.toolboxes.map((toolbox) => toolbox.id),
  };
}

type AgentDialogProps = {
  open: boolean;
  editingName: string | null;
  templates: { id: string; name: string; body: string }[];
  form: AgentFormState;
  error: string | null;
  pending: boolean;
  onChange: (update: Partial<AgentFormState>) => void;
  onApplyTemplate: (templateId: string) => void;
  onToolsDropped: (dropped: string[]) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AgentDialog({
  open,
  editingName,
  templates,
  form,
  error,
  pending,
  onChange,
  onApplyTemplate,
  onToolsDropped,
  onSave,
  onClose,
}: AgentDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>{editingName ? "Edit agent" : "New agent"}</DialogTitle>
          <DialogDescription>
            Configure the agent&apos;s identity, retrieval topics, tools, and
            instructions.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              value={form.name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-description">Description</Label>
            <Input
              id="agent-description"
              value={form.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </div>
          <AgentTopicPicker
            selectedTopicIds={form.topicIds}
            onChange={(topicIds) => onChange({ topicIds })}
          />
          <AgentToolPicker
            selectedToolKeys={form.toolKeys}
            selectedToolboxIds={form.toolboxIds}
            onChange={(toolKeys, toolboxIds, dropped) => {
              onChange({ toolKeys, toolboxIds });
              if (dropped.length) onToolsDropped(dropped);
            }}
          />
          <div className="grid gap-2">
            {templates.length > 0 ? (
              <div className="grid gap-2">
                <Label htmlFor="agent-template">
                  Apply instruction template
                </Label>
                <select
                  id="agent-template"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                  value=""
                  onChange={(event) => {
                    if (event.target.value) onApplyTemplate(event.target.value);
                  }}
                >
                  <option value="">Choose a template…</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Label htmlFor="agent-instructions">Instructions</Label>
            <Textarea
              id="agent-instructions"
              className="scrollbar-elegant max-h-64 min-h-40 resize-y overflow-auto font-mono text-sm"
              rows={6}
              value={form.instructions}
              maxLength={INSTRUCTIONS_MAX_LENGTH}
              onChange={(event) =>
                onChange({ instructions: event.target.value })
              }
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving..." : "Save agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}