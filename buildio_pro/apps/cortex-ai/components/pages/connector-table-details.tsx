"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Link2, Loader2 } from "lucide-react";
import { useState } from "react";

import { useSchemaTable } from "@/api/connections/query";
import type { SchemaTable } from "@/api/connections/types";
import { ConnectorTablePhysicalDetails } from "@/components/pages/connector-table-physical-details";
import { TableExplanationEditor } from "@/components/pages/table-explanation-editor";
import { TableRelinkDialog } from "@/components/pages/table-relink-dialog";

const TYPE_LABELS: Record<string, string> = {
  table: "Table",
  partitioned_table: "Partitioned table",
  view: "View",
  materialized_view: "Materialized view",
  foreign_table: "Foreign table",
  collection: "Collection",
};

const REVIEW_LABELS: Record<string, string> = {
  structure_changed: "Structure changed since review",
  source_identity_unavailable: "Source identity unavailable",
  missing_from_snapshot: "Missing from the last refresh",
  missing_from_source: "No longer present in the source",
  outside_discovery_scope: "Outside the discovery scope",
  dropped_or_replaced: "Replaced by a new object",
  epoch_changed: "Connector target changed",
};

/** Selected-table details keyed by the stable app table ID. */
export function ConnectorTableDetails({
  connectionId,
  table,
  postgres,
  onDirtyChange,
}: {
  connectionId: string;
  table: SchemaTable;
  postgres: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const detail = useSchemaTable(connectionId, table.id);
  const [relinkOpen, setRelinkOpen] = useState(false);
  const status = detail.data?.table.status ?? table.status;
  const reviewReason = detail.data?.table.reviewReason ?? table.reviewReason;
  const relinkable =
    status !== "active" && detail.data?.context?.explanation != null;

  return (
    <aside
      className="max-h-[36rem] space-y-5 overflow-auto rounded-lg border p-4"
      aria-label="Table details"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-all font-semibold">{table.tableName}</h3>
          <p className="text-sm text-muted-foreground">{table.schemaName}</p>
        </div>
        <Badge variant="secondary">
          {TYPE_LABELS[table.objectType] ?? table.objectType}
        </Badge>
      </div>
      {status !== "active" && (
        <div className="space-y-2 rounded-md border border-amber-600/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium capitalize">{status.replace("-", " ")}</p>
          <p className="text-muted-foreground">
            {REVIEW_LABELS[reviewReason ?? ""] ??
              "This object is unavailable to execution tools until reviewed."}
          </p>
          {relinkable && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRelinkOpen(true)}
            >
              <Link2 /> Relink explanation…
            </Button>
          )}
        </div>
      )}
      {detail.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading table details…
        </div>
      ) : detail.isError ? (
        <p className="text-sm text-destructive">Unable to load table details.</p>
      ) : detail.data ? (
        <>
          <section className="space-y-1" aria-label="Source comment">
            <h4 className="text-sm font-medium">Source database comment</h4>
            <p className="break-all text-sm text-muted-foreground">
              {detail.data.table.databaseComment?.trim() ||
                "No comment found in the source database."}
            </p>
          </section>
          <TableExplanationEditor
            connectionId={connectionId}
            tableId={table.id}
            context={detail.data.context}
            onDirtyChange={onDirtyChange}
          />
          {postgres && (
            <ConnectorTablePhysicalDetails
              details={detail.data.details}
              triggers={detail.data.triggers}
            />
          )}
        </>
      ) : null}
      {relinkOpen && (
        <TableRelinkDialog
          connectionId={connectionId}
          table={table}
          open={relinkOpen}
          onOpenChange={setRelinkOpen}
        />
      )}
    </aside>
  );
}
