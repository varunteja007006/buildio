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

import type {
  ExtractionTemplate,
  TemplateSuggestion,
} from "@/api/extraction-templates/types";
import { ChatModelSelector } from "@/components/chat/chat-model-selector";
import { TemplateGenerate } from "@/components/extraction-templates/template-generate";
import type { ChatModelOption } from "@/lib/chat/models";

export type FormState = {
  name: string;
  description: string;
  instructions: string;
  outputSchema: string;
  defaultModel: string;
};

export const emptyForm: FormState = {
  name: "",
  description: "",
  instructions: "",
  outputSchema: "",
  defaultModel: "",
};

export function toForm(template: ExtractionTemplate | null): FormState {
  if (!template) return emptyForm;
  return {
    name: template.name,
    description: template.description ?? "",
    instructions: template.instructions,
    outputSchema: template.outputSchema
      ? JSON.stringify(template.outputSchema, null, 2)
      : "",
    defaultModel: template.defaultModel ?? "",
  };
}

type TemplateDialogProps = {
  template: ExtractionTemplate | null | undefined;
  form: FormState;
  error: string | null;
  pending: boolean;
  models: ChatModelOption[];
  modelsLoading: boolean;
  exposeModelChoice: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onGenerated: (suggestion: TemplateSuggestion) => void;
  onSave: () => void;
  onClose: () => void;
};

export function TemplateDialog({
  template,
  form,
  error,
  pending,
  models,
  modelsLoading,
  exposeModelChoice,
  onChange,
  onGenerated,
  onSave,
  onClose,
}: TemplateDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={template !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>
            {template ? "Edit extraction template" : "New extraction template"}
          </DialogTitle>
          <DialogDescription>
            Define the instructions and optional JSON output shape used by
            extraction.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <TemplateGenerate disabled={pending} onGenerated={onGenerated} />
          <div className="grid gap-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-instructions">Instructions</Label>
            <Textarea
              id="template-instructions"
              className="scrollbar-elegant max-h-64 min-h-40 resize-y overflow-auto font-mono text-sm"
              rows={6}
              value={form.instructions}
              onChange={(event) => onChange("instructions", event.target.value)}
            />
          </div>
          {exposeModelChoice && (
            <div className="grid gap-2">
              <Label htmlFor="template-model">Default model</Label>
              <ChatModelSelector
                models={models}
                value={form.defaultModel}
                loading={modelsLoading}
                className="w-full"
                container={contentRef}
                onSelect={(modelId) => onChange("defaultModel", modelId)}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="template-schema">Output JSON schema</Label>
            <Textarea
              id="template-schema"
              className="max-h-80 min-h-40 resize-y overflow-auto font-mono text-sm"
              rows={6}
              placeholder={'{"type":"object"}'}
              value={form.outputSchema}
              onChange={(event) => onChange("outputSchema", event.target.value)}
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
