import { Badge } from "@workspace/ui/components/badge";
import { Loader2 } from "lucide-react";

import { useConnectionTableDetails } from "@/api/connections/query";
import type { ConnectorTable } from "@/api/connections/types";

const TYPE_LABELS: Record<ConnectorTable["objectType"], string> = {
  table: "Table",
  partitioned_table: "Partitioned table",
  view: "View",
  materialized_view: "Materialized view",
  foreign_table: "Foreign table",
  collection: "Collection",
};

function formatBytes(value: string) {
  const bytes = BigInt(value);
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let divisor = 1n;
  let unit = 0;
  while (bytes >= divisor * 1024n && unit < units.length - 1) {
    divisor *= 1024n;
    unit += 1;
  }
  return `${(Number(bytes) / Number(divisor)).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function ConnectorTableDetails({
  connectionId,
  table,
  postgres,
}: {
  connectionId: string;
  table: ConnectorTable;
  postgres: boolean;
}) {
  const metadata = useConnectionTableDetails(
    connectionId,
    table.schema,
    table.name,
    postgres,
  );

  return (
    <aside
      className="max-h-[36rem] overflow-auto rounded-lg border p-4"
      aria-label="Table details"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-all font-semibold">{table.name}</h3>
          <p className="text-sm text-muted-foreground">{table.schema}</p>
        </div>
        <Badge variant="secondary">{TYPE_LABELS[table.objectType]}</Badge>
      </div>
      {postgres && (
        <div className="mt-5 space-y-5">
          {metadata.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading table
              metadata…
            </div>
          ) : metadata.isError ? (
            <p className="text-sm text-destructive">
              Unable to load table metadata.
            </p>
          ) : metadata.data ? (
            <>
              <section className="space-y-2">
                <h4 className="text-sm font-medium">Storage</h4>
                {metadata.data.storage ? (
                  <dl className="grid grid-cols-3 gap-2 rounded-md border p-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Table</dt>
                      <dd className="font-medium">
                        {formatBytes(metadata.data.storage.tableBytes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Indexes</dt>
                      <dd className="font-medium">
                        {formatBytes(metadata.data.storage.indexBytes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="font-medium">
                        {formatBytes(metadata.data.storage.totalBytes)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No local storage (view or foreign table).
                  </p>
                )}
              </section>
              <section className="space-y-2">
                <h4 className="text-sm font-medium">
                  Columns ({metadata.data.columns.length})
                </h4>
                {metadata.data.columns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No columns.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {metadata.data.columns.map((column) => (
                      <li key={column.name} className="space-y-0.5 p-2 text-xs">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="break-all font-medium">
                            {column.name}
                          </span>
                          <span className="text-muted-foreground">
                            {column.type}
                            {column.nullable ? "" : " · not null"}
                          </span>
                        </div>
                        {column.defaultValue && (
                          <p className="break-all text-muted-foreground">
                            Default: {column.defaultValue}
                          </p>
                        )}
                        {column.comment && (
                          <p className="break-all text-muted-foreground">
                            {column.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <MetadataList
                title="Indexes"
                items={metadata.data.indexes.map((index) => ({
                  key: index.name,
                  label: index.name,
                  type:
                    [index.primary && "Primary", index.unique && "Unique"]
                      .filter(Boolean)
                      .join(" · ") || index.method,
                  description: index.definition,
                }))}
              />
              <MetadataList
                title="Constraints"
                items={metadata.data.constraints.map((constraint) => ({
                  key: constraint.name,
                  label: constraint.name,
                  type: constraint.type,
                  description: constraint.definition,
                }))}
              />
            </>
          ) : null}
        </div>
      )}
      {table.objectType !== "collection" && (
        <section className="mt-5 space-y-2">
          <div>
            <h4 className="text-sm font-medium">Triggers</h4>
            <p className="text-xs text-muted-foreground">
              Database trigger definitions; no table rows are read.
            </p>
          </div>
          {table.triggers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No user-defined triggers.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {table.triggers.map((trigger) => (
                <li key={trigger.name} className="space-y-1.5 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="break-all font-medium">
                      {trigger.name}
                    </span>
                    <Badge
                      variant={
                        trigger.enabled === "disabled" ? "outline" : "secondary"
                      }
                    >
                      {trigger.enabled}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {trigger.timing} {trigger.events.join(" / ")} ·{" "}
                    {trigger.rowLevel ? "per row" : "per statement"}
                  </p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {trigger.functionSchema}.{trigger.functionName}()
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </aside>
  );
}

function MetadataList({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string; type: string; description: string }[];
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium">
        {title} ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None found.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.key} className="space-y-1 p-2 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="break-all font-medium">{item.label}</span>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <p className="break-all text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
