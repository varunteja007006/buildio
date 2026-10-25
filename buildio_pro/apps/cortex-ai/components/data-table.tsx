"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

export type Column<T> = {
  header: string;
  accessor: (item: T) => ReactNode;
  /** CSS classes for <th> — useful for responsive visibility like `hidden md:table-cell` */
  headClassName?: string;
  /** CSS classes for every <td> in this column */
  cellClassName?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (item: T) => void;
};

/** Clicks on interactive cell content (action buttons, popovers, links) must not trigger the row's onClick. */
const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, label, [role='button'], [aria-haspopup]";

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "No data.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.header} className={col.headClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={
                  onRowClick
                    ? (event) => {
                        if (!isInteractiveTarget(event.target)) {
                          onRowClick(item);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <TableCell key={col.header} className={col.cellClassName}>
                    {col.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
