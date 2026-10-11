"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useRefreshSchema } from "@/api/connections/query";
import type { SchemaTablePage } from "@/api/connections/types";

function formatDate(value: string | null) {
  if (!value) return "never";
  return new Date(value).toLocaleString();
}

/** Refresh card: last sync state, drift summary, and explicit refresh action. */
export function ConnectorSchemaRefresh({
  connectionId,
  page,
}: {
  connectionId: string;
  page: SchemaTablePage;
}) {
  const refresh = useRefreshSchema();
  const { lastSync, summary } = page;
  const drift = summary["needs-review"] + summary.removed;
  const running = lastSync?.status === "running";

  const runRefresh = (declareReplacement: boolean) => {
    if (
      declareReplacement &&
      !window.confirm(
        "Start a new schema epoch? Existing table records are kept for review, and explanations are re-linked explicitly.",
      )
    )
      return;
    refresh.mutate(
      { id: connectionId, input: { declareReplacement } },
      {
        onSuccess: (data) => {
          if (data.status === "succeeded")
            toast.success(`Schema refreshed (${data.tableCount} objects)`);
          else toast.error(data.errorMessage ?? "Schema refresh failed");
        },
        onError: (error) => {
          const serverMessage = (
            error as { response?: { data?: { error?: string } } }
          )?.response?.data?.error;
          toast.error(
            serverMessage ??
              (error instanceof Error ? error.message : "Schema refresh failed"),
          );
        },
      },
    );
  };

  if (!lastSync)
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4"
        data-testid="schema-first-sync-prompt"
      >
        <div className="min-w-0 text-sm">
          <p className="font-medium">Synchronize the schema first</p>
          <p className="text-muted-foreground">
            One refresh discovers tables and enables saved explanations.
          </p>
        </div>
        <Button onClick={() => runRefresh(false)} disabled={refresh.isPending}>
          {refresh.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Refresh schema
        </Button>
      </div>
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
      <div className="min-w-0 space-y-1">
        <p>
          <span className="font-medium">
            {lastSync.status === "succeeded"
              ? "Last refresh"
              : lastSync.status === "running"
                ? "Refresh running…"
                : "Last refresh failed"}
          </span>{" "}
          <span className="text-muted-foreground">
            {formatDate(lastSync.completedAt ?? lastSync.startedAt)} ·{" "}
            {lastSync.tableCount} objects
          </span>
        </p>
        {lastSync.status === "failed" && (
          <p className="text-destructive">
            {lastSync.errorMessage ?? "The last refresh failed."} The previous
            snapshot is preserved.
          </p>
        )}
        <p className="text-muted-foreground">
          {summary.active} active · {summary["needs-review"]} needs review ·{" "}
          {summary.removed} removed
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {drift > 0 && (
          <Button
            variant="outline"
            disabled={running || refresh.isPending}
            onClick={() => runRefresh(true)}
          >
            Target replaced? New epoch
          </Button>
        )}
        <Button
          onClick={() => runRefresh(false)}
          disabled={running || refresh.isPending}
        >
          {running || refresh.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Refresh schema
        </Button>
      </div>
    </div>
  );
}