"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useChatModels } from "@/api/chat/query";
import { useExtractionTemplates } from "@/api/extraction-templates/query";
import {
  runExtractionsConcurrently,
  useCreateExtractions,
} from "@/api/extractions/query";
import { ChatModelSelector } from "@/components/chat/chat-model-selector";
import { CortexSwitch } from "@/components/cortex-switch";

type ExtractDocumentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentIds: string[];
  /** Called after the extractions are queued (used to clear row selection) */
  onQueued?: () => void;
};

/**
 * Bulk "Extract" dialog: pick a template, optionally override the model,
 * and toggle auto-ingestion. Queues one pending extraction per document and
 * then runs them sequentially in the background (badges poll for progress).
 */
export function ExtractDocumentsDialog({
  open,
  onOpenChange,
  documentIds,
  onQueued,
}: ExtractDocumentsDialogProps) {
  const [templateId, setTemplateId] = useState("");
  const [model, setModel] = useState("");
  const [autoIngest, setAutoIngest] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { data: templateData, isLoading: templatesLoading } =
    useExtractionTemplates(1, 100);
  const { data: modelsData, isLoading: modelsLoading } = useChatModels(
    templateData?.exposeUserModelChoice === true,
  );
  const createExtractions = useCreateExtractions();

  const templates = templateData?.templates ?? [];
  const exposeModelChoice = templateData?.exposeUserModelChoice === true;
  const models = modelsData?.models ?? [];
  const template = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (open) {
      setTemplateId("");
      setModel("");
      setAutoIngest(false);
    }
  }, [open]);

  const handleExtract = () => {
    if (!templateId || documentIds.length === 0) return;
    createExtractions.mutate(
      {
        documentIds,
        templateId,
        model: model || undefined,
        autoIngest,
      },
      {
        onSuccess: (data) => {
          onQueued?.();
          onOpenChange(false);
          void runExtractionsConcurrently(
            data.extractions.map((extraction) => extraction.id),
            queryClient,
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>Extract from documents</DialogTitle>
          <DialogDescription>
            Queue an AI extraction for{" "}
            <span className="font-medium text-foreground">
              {documentIds.length}
            </span>{" "}
            selected document{documentIds.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="extract-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="extract-template" className="w-full">
                <SelectValue
                  placeholder={
                    templatesLoading
                      ? "Loading templates…"
                      : "Select a template"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && !templatesLoading && (
              <p className="text-xs text-muted-foreground">
                No templates yet —{" "}
                <Link
                  href="/dashboard/documents/extraction-templates"
                  onClick={() => onOpenChange(false)}
                  className="text-foreground font-medium underline underline-offset-4 hover:text-foreground/80"
                >
                  create one under Documents → Templates
                </Link>
                .
              </p>
            )}
          </div>
          {exposeModelChoice && (
            <div className="grid gap-2">
              <Label htmlFor="extract-model">Model</Label>
              <ChatModelSelector
                models={models}
                value={model}
                loading={modelsLoading}
                className="w-full"
                container={contentRef}
                onSelect={setModel}
              />
              <p className="text-xs text-muted-foreground">
                {model
                  ? "Overrides the template's default model for this run."
                  : "Uses the template's default model."}
              </p>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 rounded-md border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="extract-auto-ingest">Auto-run ingestion</Label>
              <p className="text-xs text-muted-foreground">
                Ingest the extracted content into chat retrieval when the
                extraction completes.
              </p>
            </div>
            <CortexSwitch
              id="extract-auto-ingest"
              checked={autoIngest}
              onCheckedChange={setAutoIngest}
            />
          </div>
          {createExtractions.isError && (
            <p className="text-sm text-destructive">
              {createExtractions.error?.message ??
                "Could not queue the extraction."}
            </p>
          )}
          {template?.description && (
            <p className="text-xs text-muted-foreground">
              Template: {template.description}
            </p>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createExtractions.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtract}
            disabled={
              !templateId ||
              documentIds.length === 0 ||
              createExtractions.isPending
            }
          >
            {createExtractions.isPending
              ? "Queueing…"
              : `Extract ${documentIds.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
