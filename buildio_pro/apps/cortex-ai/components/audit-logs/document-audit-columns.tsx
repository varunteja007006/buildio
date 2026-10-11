"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

import {
  formatDateTime,
  formatDuration,
  formatTokensCompact,
  truncate,
} from "@/api/audit-logs/helpers";
import {
  asAiTokens,
  asDocumentIds,
  type DocumentAuditAction,
  type DocumentAuditLog,
} from "@/api/document-audit-logs/types";
import type { Column } from "@/components/data-table";

export const ACTION_LABELS: Record<DocumentAuditAction, string> = {
  extract: "Extract",
  ingest: "Ingest",
  delete: "Delete",
  restore: "Restore",
  permanent_delete: "Permanent delete",
  template_create: "Template create",
  template_update: "Template update",
  template_delete: "Template delete",
};

function statusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "deleted":
    case "permanent_deleted":
      return "destructive";
    case "created":
    case "updated":
    case "restored":
      return "secondary";
    default:
      return "outline";
  }
}

export function getDocumentAuditColumns(
  onView: (log: DocumentAuditLog) => void,
): Column<DocumentAuditLog>[] {
  return [
    {
      header: "Time",
      accessor: (log) => (
        <span className="text-muted-foreground">
          {formatDateTime(log.createdAt)}
        </span>
      ),
      cellClassName: "whitespace-nowrap",
    },
    {
      header: "Action",
      accessor: (log) => <>{ACTION_LABELS[log.action] ?? log.action}</>,
    },
    {
      header: "Documents",
      accessor: (log) => {
        const ids = asDocumentIds(log.documentIds);
        if (ids.length === 0) return "—";
        return (
          <span
            className="block max-w-40 truncate font-mono text-xs"
            title={ids.join(", ")}
          >
            {ids.length === 1
              ? truncate(ids[0], 16)
              : `${ids.length} documents`}
          </span>
        );
      },
    },
    {
      header: "Model",
      accessor: (log) => (
        <div className="flex flex-col">
          <span className="font-medium">{log.model ?? "—"}</span>
          {log.provider ? (
            <span className="text-xs text-muted-foreground">
              {log.provider}
            </span>
          ) : null}
        </div>
      ),
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
    {
      header: "Tokens",
      accessor: (log) => {
        const tokens = asAiTokens(log.usage);
        if (!tokens) return <span className="text-muted-foreground">—</span>;
        const breakdown = [
          tokens.inputTokens != null
            ? `input ${tokens.inputTokens.toLocaleString()}`
            : null,
          tokens.outputTokens != null
            ? `output ${tokens.outputTokens.toLocaleString()}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <span
            className="whitespace-nowrap tabular-nums"
            title={breakdown || undefined}
          >
            {formatTokensCompact(tokens.totalTokens)}
          </span>
        );
      },
      headClassName: "hidden xl:table-cell",
      cellClassName: "hidden xl:table-cell",
    },
    {
      header: "Duration",
      accessor: (log) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {formatDuration(log.durationMs)}
        </span>
      ),
      headClassName: "hidden xl:table-cell",
      cellClassName: "hidden xl:table-cell",
    },
    {
      header: "Status",
      accessor: (log) => (
        <Badge variant={statusVariant(log.status)}>{log.status ?? "—"}</Badge>
      ),
    },
    {
      header: "Error",
      accessor: (log) => (
        <span className="block max-w-48 truncate" title={log.error ?? ""}>
          {truncate(log.error, 40)}
        </span>
      ),
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
    },
    {
      header: "",
      accessor: (log) => (
        <Button variant="outline" size="sm" onClick={() => onView(log)}>
          View
        </Button>
      ),
      cellClassName: "text-right",
    },
  ];
}
