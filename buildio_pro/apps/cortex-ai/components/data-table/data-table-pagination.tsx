"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  total?: number;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData extends RowData>({
  table,
  total,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTablePaginationProps<TData>) {
  const {
    pagination: { pageIndex, pageSize },
  } = table.state;
  const pageCount = Math.max(1, table.getPageCount());
  const rowCount = total ?? table.getPrePaginatedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-2.5 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-muted-foreground">
        {rowCount > 0 ? (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {pageIndex * pageSize + 1}
            </span>
            {" - "}
            <span className="font-medium text-foreground">
              {Math.min((pageIndex + 1) * pageSize, rowCount)}
            </span>{" "}
            of <span className="font-medium text-foreground">{rowCount}</span>
          </>
        ) : (
          "0 results"
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger size="sm" className="h-7 text-xs">
            <SelectValue placeholder={`${pageSize} / page`} />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-36">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="flex min-w-14 items-center justify-center px-1 text-xs tabular-nums">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
