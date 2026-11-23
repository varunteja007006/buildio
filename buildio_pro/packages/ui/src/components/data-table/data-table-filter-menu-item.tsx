"use client";

import type { RowData, Column } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Check, X } from "lucide-react";
import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { onFilterInputRender } from "@workspace/ui/components/data-table/data-table-filter-menu-input";
import { REMOVE_FILTER_SHORTCUTS } from "@workspace/ui/components/data-table/data-table-filter-menu-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  getDefaultFilterOperator,
  getFilterOperators,
} from "@workspace/ui/lib/data-table";
import { cn } from "@workspace/ui/lib/utils";
import type {
  ExtendedColumnFilter,
  FilterOperator,
} from "@workspace/ui/types/data-table";

interface DataTableFilterItemProps<TData extends RowData> {
  filter: ExtendedColumnFilter<TData>;
  filterItemId: string;
  columns: Column<DataTableFeatures, TData>[];
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void;
  onFilterRemove: (filterId: string) => void;
}

export function DataTableFilterItem<TData extends RowData>({
  filter,
  filterItemId,
  columns,
  onFilterUpdate,
  onFilterRemove,
}: DataTableFilterItemProps<TData>) {
  {
    const [showFieldSelector, setShowFieldSelector] = React.useState(false);
    const [showOperatorSelector, setShowOperatorSelector] =
      React.useState(false);
    const [showValueSelector, setShowValueSelector] = React.useState(false);

    const column = columns.find((column) => column.id === filter.id);

    const operatorListboxId = `${filterItemId}-operator-listbox`;
    const inputId = `${filterItemId}-input`;

    const columnMeta = column?.columnDef.meta;
    const filterOperators = getFilterOperators(filter.variant);

    const onItemKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (showFieldSelector || showOperatorSelector || showValueSelector) {
          return;
        }

        if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase())) {
          event.preventDefault();
          onFilterRemove(filter.filterId);
        }
      },
      [
        filter.filterId,
        showFieldSelector,
        showOperatorSelector,
        showValueSelector,
        onFilterRemove,
      ],
    );

    if (!column) return null;

    return (
      <div
        key={filter.filterId}
        role="listitem"
        id={filterItemId}
        className="flex h-8 items-center rounded-md bg-background"
        onKeyDown={onItemKeyDown}
      >
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none rounded-l-md border border-r-0 font-normal dark:bg-input/30"
            >
              {columnMeta?.icon && (
                <columnMeta.icon className="text-muted-foreground" />
              )}
              {columnMeta?.label ?? column.id}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-0">
            <Command loop>
              <CommandInput placeholder="Search fields..." />
              <CommandList>
                <CommandEmpty>No fields found.</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={() => {
                        onFilterUpdate(filter.filterId, {
                          id: column.id as Extract<keyof TData, string>,
                          variant: column.columnDef.meta?.variant ?? "text",
                          operator: getDefaultFilterOperator(
                            column.columnDef.meta?.variant ?? "text",
                          ),
                          value: "",
                        });

                        setShowFieldSelector(false);
                      }}
                    >
                      {column.columnDef.meta?.icon && (
                        <column.columnDef.meta.icon />
                      )}
                      <span className="truncate">
                        {column.columnDef.meta?.label ?? column.id}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          column.id === filter.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showOperatorSelector}
          onOpenChange={setShowOperatorSelector}
          value={filter.operator}
          onValueChange={(value: FilterOperator) =>
            onFilterUpdate(filter.filterId, {
              operator: value,
              value:
                value === "isEmpty" || value === "isNotEmpty"
                  ? ""
                  : filter.value,
            })
          }
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            className="h-8 rounded-none border-r-0 px-2.5 lowercase data-size:h-8 [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.operator} />
          </SelectTrigger>
          <SelectContent id={operatorListboxId}>
            {filterOperators.map((operator) => (
              <SelectItem
                key={operator.value}
                className="lowercase"
                value={operator.value}
              >
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onFilterInputRender({
          filter,
          column,
          inputId,
          onFilterUpdate,
          showValueSelector,
          setShowValueSelector,
        })}
        <Button
          aria-controls={filterItemId}
          variant="ghost"
          size="sm"
          className="h-full rounded-none rounded-r-md border border-l-0 px-1.5 font-normal dark:bg-input/30"
          onClick={() => onFilterRemove(filter.filterId)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }
}
