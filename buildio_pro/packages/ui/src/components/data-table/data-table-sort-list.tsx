"use client";

import type { Table } from "@tanstack/react-table";
import { ArrowDownUp } from "lucide-react";
import * as React from "react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTableSortItem } from "@workspace/ui/components/data-table/data-table-sort-list-item";
import { useDataTableSortList } from "@workspace/ui/components/data-table/use-data-table-sort-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Sortable,
  SortableContent,
  SortableOverlay,
} from "@workspace/ui/components/sortable";
import { cn } from "@workspace/ui/lib/utils";

interface DataTableSortListProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataTableSortList<TData>({
  table,
  disabled,
  ...props
}: DataTableSortListProps<TData>) {
  const id = React.useId();
  const labelId = React.useId();
  const descriptionId = React.useId();
  const addButtonRef = React.useRef<HTMLButtonElement>(null);

  const {
    open,
    setOpen,
    sorting,
    onSortingChange,
    columnLabels,
    columns,
    onSortAdd,
    onSortUpdate,
    onSortRemove,
    onSortingReset,
    onTriggerKeyDown,
  } = useDataTableSortList(table);

  return (
    <Sortable
      value={sorting}
      onValueChange={onSortingChange}
      getItemValue={(item) => item.id}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
            onKeyDown={onTriggerKeyDown}
            disabled={disabled}
          >
            <ArrowDownUp className="text-muted-foreground" />
            Sort
            {sorting.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono font-normal text-[10.4px]"
              >
                {sorting.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          className="flex w-full max-w-(--available-width) flex-col gap-3.5 p-4 sm:min-w-[380px]"
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h4 id={labelId} className="font-medium leading-none">
              {sorting.length > 0 ? "Sort by" : "No sorting applied"}
            </h4>
            <p
              id={descriptionId}
              className={cn(
                "text-muted-foreground text-sm",
                sorting.length > 0 && "sr-only",
              )}
            >
              {sorting.length > 0
                ? "Modify sorting to organize your rows."
                : "Add sorting to organize your rows."}
            </p>
          </div>
          {sorting.length > 0 && (
            <SortableContent asChild>
              <div
                role="list"
                className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1"
              >
                {sorting.map((sort) => (
                  <DataTableSortItem
                    key={sort.id}
                    sort={sort}
                    sortItemId={`${id}-sort-${sort.id}`}
                    columns={columns}
                    columnLabels={columnLabels}
                    onSortUpdate={onSortUpdate}
                    onSortRemove={onSortRemove}
                  />
                ))}
              </div>
            </SortableContent>
          )}
          <div className="flex w-full items-center gap-2">
            <Button
              size="sm"
              className="rounded"
              ref={addButtonRef}
              onClick={onSortAdd}
              disabled={columns.length === 0}
            >
              Add sort
            </Button>
            {sorting.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded"
                onClick={onSortingReset}
              >
                Reset sorting
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[180px] rounded-sm bg-primary/10" />
          <div className="h-8 w-24 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}
