"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Loader2, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useRelinkSchemaTable,
  useSchemaTables,
} from "@/api/connections/query";
import type { SchemaTable } from "@/api/connections/types";

/**
 * Explicit relink of a removed/needs-review table's explanation onto an
 * active replacement object. Explanations move; policy never transfers.
 */
export function TableRelinkDialog({
  connectionId,
  table,
  open,
  onOpenChange,
}: {
  connectionId: string;
  table: SchemaTable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const candidates = useSchemaTables(
    connectionId,
    { status: "active", pageSize: 100 },
    open,
  );
  const relink = useRelinkSchemaTable(connectionId);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const destination = candidates.data?.tables.find(
    (candidate) => candidate.id === destinationId,
  );

  const submit = () => {
    if (!destination) return;
    relink.mutate(
      {
        tableId: table.id,
        input: { destinationTableId: destination.id, confirm: true },
      },
      {
        onSuccess: () => {
          toast.success("Explanation relinked");
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to relink",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Relink explanation">
        <DialogHeader>
          <DialogTitle>Relink explanation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {table.schemaName}.{table.tableName}
            </span>{" "}
            is {table.status === "removed" ? "removed" : "needs review"}. Move
            its saved explanation to an active replacement object.
          </p>
          <select
            aria-label="Destination table"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={destinationId ?? ""}
            onChange={(event) => setDestinationId(event.target.value)}
          >
            <option value="" disabled>
              Select an active table…
            </option>
            {candidates.data?.tables
              .filter((candidate) => candidate.id !== table.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.schemaName}.{candidate.tableName}
                  {candidate.explanation ? " (has explanation)" : ""}
                </option>
              ))}
          </select>
          {destination?.explanation && (
            <p className="text-destructive">
              This destination already has an explanation; resolve the conflict
              by choosing another object.
            </p>
          )}
          <label className="flex items-start gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              I understand this moves only the explanation. Execution
              permissions and policy are not transferred, and the destination
              object identity ({destination?.schemaName}.
              {destination?.tableName ?? "…"}) will own this context.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!destination || !confirmed || relink.isPending}
            onClick={submit}
          >
            {relink.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Link2 />
            )}
            Relink explanation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
