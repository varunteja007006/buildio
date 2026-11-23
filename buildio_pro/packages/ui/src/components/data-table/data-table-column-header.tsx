"use client";

import { Subscribe, type Column, type RowData } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<DataTableFeatures, TData, TValue>;
  label: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  label,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{label}</div>;
  }

  return (
    <Subscribe
      source={column.table.atoms.sorting}
      selector={() => column.getIsSorted()}
    >
      {(sorted) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring data-popup-open:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
              className,
            )}
            {...props}
          >
            {label}
            {column.getCanSort() &&
              (sorted === "desc" ? (
                <ChevronDown />
              ) : sorted === "asc" ? (
                <ChevronUp />
              ) : (
                <ChevronsUpDown />
              ))}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-28">
            {column.getCanSort() && (
              <>
                <DropdownMenuCheckboxItem
                  className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                  checked={sorted === "asc"}
                  onClick={() => column.toggleSorting(false)}
                >
                  <ChevronUp />
                  Asc
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                  checked={sorted === "desc"}
                  onClick={() => column.toggleSorting(true)}
                >
                  <ChevronDown />
                  Desc
                </DropdownMenuCheckboxItem>
                {sorted && (
                  <DropdownMenuItem
                    className="pl-2 [&_svg]:text-muted-foreground"
                    onClick={() => column.clearSorting()}
                  >
                    <X />
                    Reset
                  </DropdownMenuItem>
                )}
              </>
            )}
            {column.getCanHide() && (
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                checked={!column.getIsVisible()}
                onClick={() => column.toggleVisibility(false)}
              >
                <EyeOff />
                Hide
              </DropdownMenuCheckboxItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Subscribe>
  );
}
