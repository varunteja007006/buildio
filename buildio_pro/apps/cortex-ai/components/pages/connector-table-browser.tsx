"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ChevronLeft, ChevronRight, FileWarning, Table2 } from "lucide-react";
import { useRef, useState } from "react";

import type {
  SchemaTable,
  SchemaTablePage,
  SchemaTableStatus,
} from "@/api/connections/types";
import { ConnectorTableDetails } from "@/components/pages/connector-table-details";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "table", label: "Tables" },
  { value: "partitioned_table", label: "Partitioned tables" },
  { value: "view", label: "Views" },
  { value: "materialized_view", label: "Materialized views" },
  { value: "foreign_table", label: "Foreign tables" },
  { value: "collection", label: "Collections" },
];

export type SchemaBrowserFilters = {
  status: SchemaTableStatus | "all";
  search: string;
  schema: string;
  objectType: string;
  page: number;
};

export function ConnectorTableBrowser({
  connectionId,
  postgres,
  page,
  loading,
  filters,
  onFiltersChange,
}: {
  connectionId: string;
  postgres: boolean;
  page: SchemaTablePage;
  loading: boolean;
  filters: SchemaBrowserFilters;
  onFiltersChange: (patch: Partial<SchemaBrowserFilters>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const tables = page.tables;
  const activeTable =
    tables.find((table) => table.id === selectedId) ?? tables[0] ?? null;

  const guardedSelect = (table: SchemaTable) => {
    if (
      dirtyRef.current &&
      !window.confirm("Discard the unsaved explanation draft?")
    )
      return;
    setSelectedId(table.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Status filter"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              status: event.target.value as SchemaBrowserFilters["status"],
            })
          }
        >
          <option value="active">Active</option>
          <option value="needs-review">Needs review</option>
          <option value="removed">Removed</option>
          <option value="all">All</option>
        </select>
        {postgres && (
          <select
            aria-label="Schema filter"
            className="h-9 max-w-48 rounded-md border bg-background px-3 text-sm"
            value={filters.schema}
            onChange={(event) => onFiltersChange({ schema: event.target.value })}
          >
            <option value="all">All schemas</option>
            {page.schemas.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
        {postgres && (
          <select
            aria-label="Object type filter"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.objectType}
            onChange={(event) =>
              onFiltersChange({ objectType: event.target.value })
            }
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <Input
          aria-label="Search tables"
          placeholder="Search…"
          className="h-9 max-w-64"
          value={filters.search}
          onChange={(event) => onFiltersChange({ search: event.target.value })}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="max-h-[36rem] min-h-48 overflow-auto rounded-lg border p-2">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Loading…</p>
          ) : tables.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              No matching database objects.
            </p>
          ) : (
            <ul className="space-y-1">
              {tables.map((table) => {
                const isActive = table.id === activeTable?.id;
                return (
                  <li key={table.id}>
                    <Button
                      variant="ghost"
                      className={`h-auto w-full justify-start gap-2 px-2 py-2 text-left ${isActive ? "bg-muted" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => guardedSelect(table)}
                    >
                      {table.status === "active" ? (
                        <Table2 className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileWarning className="size-4 shrink-0 text-amber-600" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {table.tableName}
                      </span>
                      {table.explanation && (
                        <span
                          aria-label="Has saved explanation"
                          className="text-xs text-emerald-600"
                        >
                          ●
                        </span>
                      )}
                      <span className="max-w-40 truncate text-xs text-muted-foreground">
                        {table.schemaName}
                      </span>
                      {postgres && (
                        <span className="hidden capitalize text-xs text-muted-foreground xl:inline">
                          {table.objectType.replaceAll("_", " ")}
                        </span>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {activeTable ? (
          <ConnectorTableDetails
            connectionId={connectionId}
            table={activeTable}
            postgres={postgres}
            onDirtyChange={(dirty) => {
              dirtyRef.current = dirty;
            }}
          />
        ) : (
          <div className="hidden rounded-lg border p-4 text-sm text-muted-foreground lg:block">
            Select a database object to see its details.
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">
          Page {page.page} of {page.pageCount} · {page.total} objects
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page.page <= 1 || loading}
          onClick={() => onFiltersChange({ page: page.page - 1 })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page.page >= page.pageCount || loading}
          onClick={() => onFiltersChange({ page: page.page + 1 })}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
