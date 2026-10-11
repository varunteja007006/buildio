"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  useDeleteExtraction,
  useExtraction,
  useRunExtraction,
  useUpdateExtraction,
} from "@/api/extractions/query";
import { CharCount } from "@/components/char-count";
import { CortexSwitch } from "@/components/cortex-switch";
import { ExtractionVersionHistory } from "@/components/documents/extraction-version-history";
import { EXTRACTION_CONTENT_MAX_LENGTH } from "@/lib/text-limits";
import { cn } from "@/lib/utils";

type ExtractionReviewDialogProps = {
  extractionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** D1/D2/D3/D6/D7: review, edit, re-run, approve, or delete an extraction. */
export function ExtractionReviewDialog({
  extractionId,
  open,
  onOpenChange,
}: ExtractionReviewDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const { data, isLoading } = useExtraction(open ? extractionId : null);
  const extraction = data?.extraction;
  const document = data?.document;

  const updateExtraction = useUpdateExtraction();
  const runExtraction = useRunExtraction();
  const deleteExtraction = useDeleteExtraction();

  const status = extraction?.status;
  const running = status === "pending" || status === "processing";
  const currentContent = extraction?.currentContent ?? "";
  const content = draft ?? currentContent;
  const dirty = draft !== null && draft !== currentContent;

  // Reset the draft when the dialog opens, or after a re-run replaces content
  useEffect(() => {
    if (!open) setDraft(null);
  }, [open, extractionId, status]);

  const canEdit = status === "completed" && !running;
  const canApprove =
    status === "completed" && !dirty && !updateExtraction.isPending;
  const saveDisabled =
    !dirty || !extraction || updateExtraction.isPending || running;

  const handleSave = () => {
    if (!extraction || !dirty) return;
    updateExtraction.mutate(
      { id: extraction.id, input: { currentContent: draft ?? "" } },
      { onSuccess: () => setDraft(null) },
    );
  };

  const handleApprove = (approved: boolean) => {
    if (!extraction) return;
    updateExtraction.mutate({ id: extraction.id, input: { approved } });
  };

  const handleRerun = () => {
    if (!extraction) return;
    setDraft(null);
    runExtraction.mutate(extraction.id);
  };

  const handleDelete = () => {
    if (!extraction) return;
    deleteExtraction.mutate(extraction.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle className="truncate">
            {document?.filename ?? "Extraction review"}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-2">
            <span>
              {(extraction?.templateSnapshot as { name?: string } | null)
                ?.name ?? "Extraction"}
            </span>
            {extraction?.model && (
              <span className="font-mono text-xs">{extraction.model}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading extraction…
            </div>
          ) : running ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Extraction running — this dialog updates automatically.
            </div>
          ) : status === "failed" ? (
            <p className="text-sm text-destructive">
              {extraction?.error ?? "Extraction failed."}
            </p>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="extraction-content">Extracted content</Label>
              <Textarea
                id="extraction-content"
                value={content}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!canEdit}
                maxLength={EXTRACTION_CONTENT_MAX_LENGTH}
                className="scrollbar-elegant max-h-72 min-h-40 resize-y overflow-auto font-mono text-sm"
              />
              <CharCount
                value={content}
                maxLength={EXTRACTION_CONTENT_MAX_LENGTH}
                className="text-right"
              />
              {dirty && (
                <p className="text-xs text-muted-foreground">
                  Unsaved edits — saving creates a new version and clears
                  approval.
                </p>
              )}
              {extraction?.structuredOutput != null && (
                <details className="rounded-md border px-3 py-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Structured output
                  </summary>
                  <pre className="scrollbar-elegant mt-2 max-h-48 overflow-auto font-mono text-xs">
                    {JSON.stringify(extraction.structuredOutput, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {extraction && (
            <div className="grid gap-2">
              <Label>Version history</Label>
              <ExtractionVersionHistory
                extractionId={extraction.id}
                currentContent={content}
              />
            </div>
          )}

          {updateExtraction.isError && (
            <p className="text-sm text-destructive">
              {updateExtraction.error?.message ?? "Update failed."}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 items-center gap-2 border-t bg-background px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  disabled={deleteExtraction.isPending}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete extraction?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The extraction moves to trash and its badge disappears.
                    Version history is kept for audit and it can be restored.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={running || runExtraction.isPending}
            >
              {runExtraction.isPending || running ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              Re-run
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <label
              className={cn(
                "flex items-center gap-2 text-sm",
                canApprove
                  ? "cursor-pointer text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <CortexSwitch
                checked={!!extraction?.approved && !dirty}
                onCheckedChange={handleApprove}
                disabled={!canApprove}
              />
              Approved for ingestion
            </label>
            <Button onClick={handleSave} disabled={saveDisabled}>
              {updateExtraction.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
