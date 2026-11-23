"use client";

import { Subscribe, type Column, type RowData } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Button } from "@workspace/ui/components/button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const toggle = () => {
    const sorted = column.getIsSorted();
    if (sorted === false) {
      column.toggleSorting(false);
    } else if (sorted === "asc") {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  };

  return (
    <Subscribe
      source={column.table.atoms.sorting}
      selector={() => column.getIsSorted()}
    >
      {(sorted) => (
        <div className={cn("flex items-center", className)}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 -ml-1.5 text-xs font-medium text-foreground"
            onClick={toggle}
          >
            <span>{title}</span>
            {sorted === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : sorted === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5 opacity-50" />
            )}
          </Button>
        </div>
      )}
    </Subscribe>
  );
}
