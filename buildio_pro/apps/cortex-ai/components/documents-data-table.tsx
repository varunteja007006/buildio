"use client";

import {
  flexRender,
  useTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { dataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Trash2 } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import { useInfiniteDocuments } from "@/api/documents/query";
import { useIngestDocuments } from "@/api/ingest/query";
import { CortexSwitch } from "@/components/cortex-switch";
import { DataTableSearch } from "@/components/data-table/data-table-search";
import { DocumentsBulkBar } from "@/components/documents/documents-bulk-bar";
import { documentsColumns } from "@/components/documents/documents-data-table-columns";
import { DocumentsTableFooter } from "@/components/documents/documents-table-footer";
import { ExtractDocumentsDialog } from "@/components/documents/extract-dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const DEFAULT_SORT = "createdAt";
const DEFAULT_SORT_DIR = "desc";

export function DocumentsDataTable() {
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault(DEFAULT_SORT),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsString.withDefault(DEFAULT_SORT_DIR),
  );
  const [showDeleted, setShowDeleted] = useQueryState(
    "deleted",
    parseAsBoolean.withDefault(false),
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [extractOpen, setExtractOpen] = React.useState(false);
  const ingestDocuments = useIngestDocuments();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = useInfiniteDocuments({
    pageSize: PAGE_SIZE,
    sort: sort as DocumentSort,
    sortDir: sortDir as "asc" | "desc",
    search: search || undefined,
    status: showDeleted ? "deleted" : undefined,
  });

  const flatData = React.useMemo(
    () => data?.pages.flatMap((p) => p.documents) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // Selection is keyed by row id; intersect with loaded rows so stale keys
  // (e.g. after filtering or switching to the deleted view) don't count.
  const selectedDocIds = React.useMemo(
    () => flatData.filter((doc) => rowSelection[doc.id]).map((doc) => doc.id),
    [flatData, rowSelection],
  );
  const clearSelection = React.useCallback(() => setRowSelection({}), []);

  // TanStack sorting state synced to URL
  const sorting = React.useMemo<SortingState>(
    () => (sort ? [{ id: sort, desc: sortDir === "desc" }] : []),
    [sort, sortDir],
  );

  const onSortingChange = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next?.[0];
      if (first) {
        setSort(first.id);
        setSortDir(first.desc ? "desc" : "asc");
      } else {
        setSort(DEFAULT_SORT);
        setSortDir(DEFAULT_SORT_DIR);
      }
    },
    [sorting, setSort, setSortDir],
  );

  const table = useTable({
    features: dataTableFeatures,
    data: flatData,
    columns: documentsColumns,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
    state: { sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    onSortingChange,
    getRowId: (row) => row.id,
  });

  // Infinite scroll sentinel
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "400px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, flatData.length]);

  const visibleColumns = table.getVisibleLeafColumns().length;

  return (
    <div className={cn("flex w-full flex-col gap-2.5 overflow-hidden")}>
      {selectedDocIds.length > 0 && (
        <DocumentsBulkBar
          selectedCount={selectedDocIds.length}
          onClear={clearSelection}
          onExtract={() => setExtractOpen(true)}
          onIngest={() => {
            ingestDocuments.mutate({ documentIds: selectedDocIds });
            clearSelection();
          }}
          ingestPending={ingestDocuments.isPending}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <DataTableSearch placeholder="Search documents…" />
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Trash2 className="size-4" />
          Deleted only
          <CortexSwitch
            checked={showDeleted}
            onCheckedChange={(checked) => {
              void setShowDeleted(checked || null);
            }}
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns} className="h-24 p-0">
                  <LoadingRows rows={PAGE_SIZE} />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns}
                  className="h-24 text-center text-muted-foreground"
                >
                  {showDeleted
                    ? "No deleted documents."
                    : "No documents found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentsTableFooter
        total={total}
        loadedCount={flatData.length}
        isLoading={isLoading}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        sentinelRef={sentinelRef}
        onLoadMore={() => void fetchNextPage()}
      />

      <ExtractDocumentsDialog
        open={extractOpen}
        onOpenChange={setExtractOpen}
        documentIds={selectedDocIds}
        onQueued={clearSelection}
      />
    </div>
  );
}

function LoadingRows({ rows }: { rows: number }) {
  const count = Math.min(Math.max(rows, 1), 6);
  return (
    <div className="flex flex-col gap-2 px-2 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-6 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}

type DocumentSort =
  "filename" | "filepath" | "fileHash" | "ingested" | "createdAt" | "updatedAt";
