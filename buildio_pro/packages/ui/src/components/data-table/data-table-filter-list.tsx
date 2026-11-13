"use client";

import type { Table } from "@tanstack/react-table";
import { parseAsStringEnum, useQueryState } from "nuqs";
import * as React from "react";

import { DataTableFilterItem } from "@workspace/ui/components/data-table/data-table-filter-item";
import {
  DEBOUNCE_MS,
  FILTER_SHORTCUT_KEY,
  REMOVE_FILTER_SHORTCUTS,
  THROTTLE_MS,
} from "@workspace/ui/components/data-table/data-table-filter-list-constants";
import {
  DataTableFilterListActions,
  DataTableFilterListHeader,
  DataTableFilterListOverlay,
  DataTableFilterListTrigger,
} from "@workspace/ui/components/data-table/data-table-filter-list-parts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Sortable, SortableContent } from "@workspace/ui/components/sortable";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounced-callback";
import { getDefaultFilterOperator } from "@workspace/ui/lib/data-table";
import { generateId } from "@workspace/ui/lib/id";
import { getFiltersStateParser } from "@workspace/ui/lib/parsers";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

interface DataTableFilterListProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>;
  debounceMs?: number;
  throttleMs?: number;
  shallow?: boolean;
  disabled?: boolean;
}

export function DataTableFilterList<TData>({
  table,
  debounceMs = DEBOUNCE_MS,
  throttleMs = THROTTLE_MS,
  shallow = true,
  disabled,
  ...props
}: DataTableFilterListProps<TData>) {
  const id = React.useId();
  const labelId = React.useId();
  const descriptionId = React.useId();
  const [open, setOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);

  const columns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.columnDef.enableColumnFilter);
  }, [table]);

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

  const [joinOperator, setJoinOperator] = useQueryState(
    table.options.meta?.queryKeys?.joinOperator ?? "",
    parseAsStringEnum(["and", "or"]).withDefault("and").withOptions({
      clearOnDefault: true,
      shallow,
    }),
  );

  const onFilterAdd = React.useCallback(() => {
    const column = columns[0];

    if (!column) return;

    debouncedSetFilters([
      ...filters,
      {
        id: column.id as Extract<keyof TData, string>,
        value: "",
        variant: column.columnDef.meta?.variant ?? "text",
        operator: getDefaultFilterOperator(
          column.columnDef.meta?.variant ?? "text",
        ),
        filterId: generateId({ length: 8 }),
      },
    ]);
  }, [columns, filters, debouncedSetFilters]);

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

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter(
        (filter) => filter.filterId !== filterId,
      );
      void setFilters(updatedFilters);
      requestAnimationFrame(() => {
        addButtonRef.current?.focus();
      });
    },
    [filters, setFilters],
  );

  const onFiltersReset = React.useCallback(() => {
    void setFilters(null);
    void setJoinOperator("and");
  }, [setFilters, setJoinOperator]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement &&
          event.target.contentEditable === "true")
      ) {
        return;
      }

      if (
        event.key.toLowerCase() === FILTER_SHORTCUT_KEY &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    <Sortable
      value={filters}
      onValueChange={setFilters}
      getItemValue={(item) => item.filterId}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <DataTableFilterListTrigger
            filtersCount={filters.length}
            onKeyDown={onTriggerKeyDown}
            disabled={disabled}
          />
        </PopoverTrigger>
        <PopoverContent
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className="flex w-full max-w-(--available-width) flex-col gap-3.5 p-4 sm:min-w-[380px]"
          {...props}
        >
          <DataTableFilterListHeader
            filtersCount={filters.length}
            labelId={labelId}
            descriptionId={descriptionId}
          />
          {filters.length > 0 ? (
            <SortableContent asChild>
              <div
                role="list"
                className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1"
              >
                {filters.map((filter, index) => (
                  <DataTableFilterItem<TData>
                    key={filter.filterId}
                    filter={filter}
                    index={index}
                    filterItemId={`${id}-filter-${filter.filterId}`}
                    joinOperator={joinOperator}
                    setJoinOperator={setJoinOperator}
                    columns={columns}
                    onFilterUpdate={onFilterUpdate}
                    onFilterRemove={onFilterRemove}
                  />
                ))}
              </div>
            </SortableContent>
          ) : null}
          <DataTableFilterListActions
            showReset={filters.length > 0}
            addButtonRef={addButtonRef}
            onAddFilter={onFilterAdd}
            onResetFilters={onFiltersReset}
          />
        </PopoverContent>
      </Popover>
      <DataTableFilterListOverlay />
    </Sortable>
  );
}
