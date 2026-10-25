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
import { DatabaseZap } from "lucide-react";

import { useIngestDocuments } from "@/api/ingest/query";
import type { IngestStatusRow } from "@/api/ingest/types";

import { IngestContentPreview } from "./ingest-content-preview";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

/**
 * Ingestion stats for a single document, opened by clicking a queue row.
 * All data comes from the queue row itself — no extra fetch.
 */
export function IngestStatsDialog({
  row,
  open,
  onOpenChange,
}: {
  row: IngestStatusRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ingest = useIngestDocuments();
  const failed = row.lastIngestError !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle className="truncate" title={row.filename}>
            {row.filename}
          </DialogTitle>
          <DialogDescription>
            {failed
              ? "Ingestion failed"
              : row.ingested
                ? "Ingested"
                : "Pending"}
            {" · "}
            {row.hasApprovedExtraction
              ? "Content from approved extraction"
              : "Content from raw file"}
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-elegant min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat
              label="Status"
              value={failed ? "Failed" : row.ingested ? "Ingested" : "Pending"}
            />
            <Stat label="Chunks" value={String(row.chunks)} />
            <Stat
              label="Content length"
              value={
                row.contentLength !== null
                  ? `${row.contentLength.toLocaleString()} chars`
                  : "—"
              }
            />
            <Stat
              label="Last ingested"
              value={
                row.lastIngestedAt
                  ? new Date(row.lastIngestedAt).toLocaleString()
                  : "—"
              }
            />
            <Stat
              label="Source"
              value={row.hasApprovedExtraction ? "Extraction" : "Raw file"}
            />
          </div>
          {row.preview && (
            <IngestContentPreview
              resourceId={row.resourceId}
              preview={row.preview}
              contentLength={row.contentLength}
            />
          )}
          {row.lastIngestError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs break-words text-destructive">
              {row.lastIngestError}
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button
            size="sm"
            onClick={() => ingest.mutate({ documentIds: [row.id] })}
            disabled={ingest.isPending}
          >
            <DatabaseZap data-icon="inline-start" />
            {failed ? "Retry ingest" : row.ingested ? "Re-ingest" : "Ingest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
