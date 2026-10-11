"use client";

import { Badge } from "@workspace/ui/components/badge";

import type { IngestStatusRow } from "@/api/ingest/types";
import type { Column } from "@/components/data-table";
import { DocumentIngestButton } from "@/components/documents/document-ingest-button";
import { DocumentIngestErrorBadge } from "@/components/documents/document-ingest-error-badge";

export function getIngestQueueColumns(): Column<IngestStatusRow>[] {
  return [
    {
      header: "Document",
      accessor: (row) => (
        <div className="max-w-sm truncate font-medium">{row.filename}</div>
      ),
    },
    {
      header: "Source",
      accessor: (row) =>
        row.hasApprovedExtraction ? (
          <Badge variant="secondary">Extraction</Badge>
        ) : (
          <Badge variant="outline">Raw file</Badge>
        ),
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
    {
      header: "Status",
      accessor: (row) => {
        if (row.lastIngestError) {
          return (
            <DocumentIngestErrorBadge
              documentId={row.id}
              filename={row.filename}
              error={row.lastIngestError}
            />
          );
        }
        if (row.ingested) {
          return <Badge variant="secondary">Ingested</Badge>;
        }
        return <span className="text-muted-foreground">Pending</span>;
      },
    },
    {
      header: "Chunks",
      accessor: (row) => (
        <span className="text-muted-foreground">{row.chunks}</span>
      ),
      headClassName: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
    },
    {
      header: "Last ingested",
      accessor: (row) => (
        <span className="text-muted-foreground">
          {row.lastIngestedAt
            ? new Date(row.lastIngestedAt).toLocaleDateString()
            : "—"}
        </span>
      ),
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
    {
      header: "",
      accessor: (row) => <DocumentIngestButton documentId={row.id} />,
    },
  ];
}
