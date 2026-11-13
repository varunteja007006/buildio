"use client";

import type { Column, Table } from "@tanstack/react-table";
import { ListFilter, X } from "lucide-react";
import { useQueryState } from "nuqs";
import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { Command } from "@workspace/ui/components/command";
import { DataTableFilterMenuFieldPicker } from "@workspace/ui/components/data-table/data-table-filter-menu-field-picker";
import { DataTableFilterItem } from "@workspace/ui/components/data-table/data-table-filter-menu-item";
import { REMOVE_FILTER_SHORTCUTS } from "@workspace/ui/components/data-table/data-table-filter-menu-utils";
import { useDataTableFilterMenuShortcut } from "@workspace/ui/components/data-table/use-data-table-filter-menu-shortcut";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounced-callback";
import { getDefaultFilterOperator } from "@workspace/ui/lib/data-table";
import { generateId } from "@workspace/ui/lib/id";
import { getFiltersStateParser } from "@workspace/ui/lib/parsers";
import { cn } from "@workspace/ui/lib/utils";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface DataTableFilterMenuProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>;
  debounceMs?: number;
  throttleMs?: number;
  shallow?: boolean;
  disabled?: boolean;
}

export function DataTableFilterMenu<TData>({
  table,
  debounceMs = DEBOUNCE_MS,
  throttleMs = THROTTLE_MS,
  shallow = true,
  disabled,
  ...props
}: DataTableFilterMenuProps<TData>) {
  const id = React.useId();

  const columns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.columnDef.enableColumnFilter);
  }, [table]);

  const [open, setOpen] = React.useState(false);
  const [selectedColumn, setSelectedColumn] =
    React.useState<Column<TData> | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open);

    if (!open) {
      setTimeout(() => {
        setSelectedColumn(null);
        setInputValue("");
      }, 100);
    }
  }, []);

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
        !inputValue &&
        selectedColumn
      ) {
        event.preventDefault();
        setSelectedColumn(null);
      }
    },
    [inputValue, selectedColumn],
  );

  useDataTableFilterMenuShortcut(
    React.useCallback(() => setOpen((prev) => !prev), []),
  );

  const [filters, setFilters] = useQueryState(
    table.options.meta?.queryKeys?.filters ?? "filters",
    getFiltersStateParser<TData>(columns.map((field) => field.id))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        shallow,
        throttleMs,
      }),
  );
  const debouncedSetFilters = useDebouncedCallback(setFilters, debounceMs);

  const onFilterAdd = React.useCallback(
    (column: Column<TData>, value: string) => {
      if (!value.trim() && column.columnDef.meta?.variant !== "boolean") {
        return;
      }

      const filterValue =
        column.columnDef.meta?.variant === "multiSelect" ? [value] : value;

      const newFilter: ExtendedColumnFilter<TData> = {
        id: column.id as Extract<keyof TData, string>,
        value: filterValue,
        variant: column.columnDef.meta?.variant ?? "text",
        operator: getDefaultFilterOperator(
          column.columnDef.meta?.variant ?? "text",
        ),
        filterId: generateId({ length: 8 }),
      };

      debouncedSetFilters([...filters, newFilter]);
      setOpen(false);

      setTimeout(() => {
        setSelectedColumn(null);
        setInputValue("");
      }, 100);
    },
    [filters, debouncedSetFilters],
  );

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter(
        (filter) => filter.filterId !== filterId,
      );
      debouncedSetFilters(updatedFilters);
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    },
    [filters, debouncedSetFilters],
  );

  const onFilterUpdate = React.useCallback(
    (
      filterId: string,
      updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
    ) => {
      debouncedSetFilters((prevFilters) => {
        const updatedFilters = prevFilters.map((filter) => {
          if (filter.filterId === filterId) {
            return { ...filter, ...updates } as ExtendedColumnFilter<TData>;
          }
          return filter;
        });
        return updatedFilters;
      });
    },
    [debouncedSetFilters],
  );

  const onFiltersReset = React.useCallback(() => {
    debouncedSetFilters([]);
  }, [debouncedSetFilters]);

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
        filters.length > 0
      ) {
        event.preventDefault();
        onFilterRemove(filters[filters.length - 1]?.filterId ?? "");
      }
    },
    [filters, onFilterRemove],
  );

  return (
    <div role="list" className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <DataTableFilterItem
          key={filter.filterId}
          filter={filter}
          filterItemId={`${id}-filter-${filter.filterId}`}
          columns={columns}
          onFilterUpdate={onFilterUpdate}
          onFilterRemove={onFilterRemove}
        />
      ))}
      {filters.length > 0 && (
        <Button
          aria-label="Reset all filters"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={onFiltersReset}
        >
          <X />
        </Button>
      )}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            aria-label="Open filter command menu"
            variant="outline"
            size={filters.length > 0 ? "icon" : "sm"}
            className={cn(filters.length > 0 && "size-8", "h-8 font-normal")}
            ref={triggerRef}
            onKeyDown={onTriggerKeyDown}
            disabled={disabled}
          >
            <ListFilter className="text-muted-foreground" />
            {filters.length > 0 ? null : "Filter"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full max-w-(--available-width) p-0"
          {...props}
        >
          <Command loop className="[&_[cmdk-input-wrapper]_svg]:hidden">
            <DataTableFilterMenuFieldPicker
              columns={columns}
              selectedColumn={selectedColumn}
              inputValue={inputValue}
              onInputValueChange={setInputValue}
              onInputKeyDown={onInputKeyDown}
              onSelectColumn={setSelectedColumn}
              onFilterAdd={onFilterAdd}
            />
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
