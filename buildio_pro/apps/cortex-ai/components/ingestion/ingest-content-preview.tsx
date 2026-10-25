"use client";

import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { useResourceContent } from "@/api/resources/query";

/**
 * Labeled preview of an ingested resource's content. Makes the truncation
 * explicit ("first N of M chars") and offers the full stored content on
 * demand, so a cut-off preview is never mistaken for truncated ingestion.
 */
export function IngestContentPreview({
  resourceId,
  preview,
  contentLength,
}: {
  resourceId: string | null;
  preview: string;
  contentLength: number | null;
}) {
  const [showFull, setShowFull] = useState(false);
  const truncated = (contentLength ?? 0) > preview.length;
  const canExpand = truncated && resourceId !== null;
  const full = useResourceContent(canExpand ? resourceId : null, showFull);

  const showFullText = showFull && canExpand;
  const fullText = full.data?.content;

  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Content preview
        </span>
        <span className="text-xs text-muted-foreground">
          {showFullText || !truncated
            ? "full content"
            : `first ${preview.length.toLocaleString()} of ${(contentLength ?? 0).toLocaleString()} chars`}
        </span>
      </div>
      <div className="scrollbar-elegant max-h-64 overflow-y-auto text-xs whitespace-pre-wrap text-muted-foreground">
        {showFullText
          ? (fullText ??
            full.error?.message ??
            (full.isFetching ? "Loading…" : "No content"))
          : `${preview}${truncated ? "…" : ""}`}
      </div>
      {canExpand && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-6 px-2 text-xs"
          onClick={() => setShowFull((v) => !v)}
          disabled={showFullText && full.isFetching}
        >
          {showFull ? "Show preview" : "Show full content"}
        </Button>
      )}
    </div>
  );
}