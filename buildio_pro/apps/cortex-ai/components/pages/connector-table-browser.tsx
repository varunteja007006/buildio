"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ConnectorTable } from "@/api/connections/types";
import { ConnectorTableDetails } from "@/components/pages/connector-table-details";
import { ConnectorTableFilters } from "@/components/pages/connector-table-filters";

const SYSTEM_SCHEMAS = new Set(["pg_catalog", "information_schema"]);
const PAGE_SIZE = 50;

function labelType(type: ConnectorTable["objectType"]) {
  return type.replaceAll("_", " ");
}

export function ConnectorTableBrowser({
  connectionId,
  tables,
  postgres,
}: {
  connectionId: string;
  tables: ConnectorTable[];
  postgres: boolean;
}) {
  const [search, setSearch] = useState("");
  const [schema, setSchema] = useState("all");
  const [objectType, setObjectType] = useState("all");
  const [includeSystemSchemas, setIncludeSystemSchemas] = useState(false);
  const [selected, setSelected] = useState<ConnectorTable | null>(null);
  const [page, setPage] = useState(1);

  const visibleTables = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return tables.filter((table) => {
      if (!includeSystemSchemas && SYSTEM_SCHEMAS.has(table.schema))
        return false;
      if (schema !== "all" && table.schema !== schema) return false;
      if (objectType !== "all" && table.objectType !== objectType) return false;
      return (
        !normalizedSearch ||
        `${table.schema}.${table.name}`
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [includeSystemSchemas, objectType, schema, search, tables]);
  const schemas = useMemo(
    () =>
      [...new Set(tables.map((table) => table.schema))]
        .filter((name) => includeSystemSchemas || !SYSTEM_SCHEMAS.has(name))
        .sort(),
    [includeSystemSchemas, tables],
  );
  const activeTable =
    (selected &&
      visibleTables.find(
        (table) =>
          table.schema === selected.schema && table.name === selected.name,
      )) ??
    visibleTables[0] ??
    null;
  const pageCount = Math.max(1, Math.ceil(visibleTables.length / PAGE_SIZE));
  const pageTables = visibleTables.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  useEffect(
    () => setPage((current) => Math.min(current, pageCount)),
    [pageCount],
  );

  return (
    <div className="space-y-3">
      {postgres && (
        <ConnectorTableFilters
          schemas={schemas}
          schema={schema}
          objectType={objectType}
          includeSystemSchemas={includeSystemSchemas}
          search={search}
          onSchemaChange={(value) => {
            setSchema(value);
            setPage(1);
          }}
          onObjectTypeChange={(value) => {
            setObjectType(value);
            setPage(1);
          }}
          onIncludeSystemSchemasChange={(include) => {
            setIncludeSystemSchemas(include);
            if (!include) setSchema("all");
            setPage(1);
          }}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      )}
      {!postgres && (
        <p className="text-sm text-muted-foreground">
          {tables.length} {tables.length === 1 ? "collection" : "collections"}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="max-h-[36rem] min-h-48 overflow-auto rounded-lg border p-2">
          {visibleTables.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              No matching {postgres ? "database objects" : "collections"}.
            </p>
          ) : (
            <ul className="space-y-1">
              {pageTables.map((table) => {
                const isActive =
                  table.schema === activeTable?.schema &&
                  table.name === activeTable?.name;
                return (
                  <li key={`${table.schema}.${table.name}`}>
                    <Button
                      variant="ghost"
                      className={`h-auto w-full justify-start gap-2 px-2 py-2 text-left ${isActive ? "bg-muted" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => {
                        setSelected(table);
                        const index = visibleTables.indexOf(table);
                        setPage(Math.floor(index / PAGE_SIZE) + 1);
                      }}
                    >
                      <Table2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {table.name}
                      </span>
                      <span className="max-w-40 truncate text-xs text-muted-foreground">
                        {table.schema}
                      </span>
                      {postgres && (
                        <span className="hidden capitalize text-xs text-muted-foreground xl:inline">
                          {labelType(table.objectType)}
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
          />
        ) : (
          <div className="hidden rounded-lg border p-4 text-sm text-muted-foreground lg:block">
            Select a database object to see its details.
          </div>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
      {postgres && (
        <p className="text-xs text-muted-foreground">
          Showing {visibleTables.length} of {tables.length} objects. Row counts
          are not queried.
        </p>
      )}
    </div>
  );
}
