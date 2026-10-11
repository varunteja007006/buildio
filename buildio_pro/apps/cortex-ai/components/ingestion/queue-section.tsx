"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight, DatabaseZap } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

import { useIngestDocuments, useIngestStatus } from "@/api/ingest/query";
import type { IngestQueueFilter, IngestStatusRow } from "@/api/ingest/types";
import { DataTable } from "@/components/data-table";
import { IngestStatsDialog } from "@/components/ingestion/ingest-stats-dialog";
import { getIngestQueueColumns } from "@/components/ingestion/queue-columns";

const PAGE_SIZE = 10;

const FILTERS: { value: IngestQueueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "ingested", label: "Ingested" },
];

export function IngestQueueSection() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<IngestQueueFilter>("all");
  const { data, isLoading } = useIngestStatus(page, PAGE_SIZE, filter);
  const ingest = useIngestDocuments();
  const rows = data?.items ?? [];
  const pageCount = data?.pageCount || 1;
  const stats = data?.stats ?? { pending: 0, failed: 0, ingested: 0 };
  const [selectedParam, setSelectedParam] = useQueryState(
    "ingest",
    parseAsString,
  );
  const selected = rows.find((row) => row.id === selectedParam) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{stats.pending}</span>{" "}
            pending
          </span>
          <span
            className={stats.failed > 0 ? "font-medium text-destructive" : ""}
          >
            {stats.failed} failed
          </span>
          <span>
            <span className="font-medium text-foreground">
              {stats.ingested}
            </span>{" "}
            ingested
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() => ingest.mutate()}
            disabled={ingest.isPending || stats.pending + stats.failed === 0}
          >
            <DatabaseZap data-icon="inline-start" /> Ingest all
          </Button>
          <div className="flex gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setFilter(item.value);
                  setPage(1);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <DataTable
        columns={getIngestQueueColumns()}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyMessage={
          filter === "all"
            ? "No documents yet. Upload files from the Documents page."
            : `No ${filter} documents.`
        }
        onRowClick={(row: IngestStatusRow) => void setSelectedParam(row.id)}
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-muted-foreground">
          {data?.total
            ? `Page ${page} of ${pageCount} · ${data.total} total`
            : "0 results"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft data-icon="inline-start" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Next <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
      {selected && (
        <IngestStatsDialog
          row={selected}
          open
          onOpenChange={(next) => {
            if (!next) void setSelectedParam(null);
          }}
        />
      )}
    </>
  );
}
