"use client";

import {
  type RowData,
  flexRender,
  type ReactTable,
} from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import * as React from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<
  TData extends RowData,
> extends React.ComponentProps<"div"> {
  table: ReactTable<DataTableFeatures, TData>;
  loading?: boolean;
  emptyState?: React.ReactNode;
  total?: number;
}

export function DataTable<TData extends RowData>({
  table,
  loading = false,
  emptyState,
  total,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const visibleColumns = table.getVisibleLeafColumns().length;

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-hidden", className)}
      {...props}
    >
      {children}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns} className="h-24 p-0">
                  <LoadingRows rows={table.state.pagination.pageSize} />
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
                  {emptyState ?? "No results found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} total={total} />
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
