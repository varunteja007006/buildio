"use client";

import {
  type RowData,
  type ColumnFiltersState,
  type TableOptions,
  type Updater,
} from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import {
  type SingleParser,
  type UseQueryStateOptions,
  parseAsArrayOf,
  parseAsString,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounced-callback";

const ARRAY_SEPARATOR = ",";

export interface UseDataTableFiltersOptions<TData extends RowData> {
  columns: TableOptions<DataTableFeatures, TData>["columns"];
  enableAdvancedFilter: boolean;
  queryStateOptions: Omit<UseQueryStateOptions<string>, "parse">;
  debounceMs: number;
  setPage: (value: number) => void;
}

export function useDataTableFilters<TData extends RowData>({
  columns,
  enableAdvancedFilter,
  queryStateOptions,
  debounceMs,
  setPage,
}: UseDataTableFiltersOptions<TData>) {
  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, SingleParser<string> | SingleParser<string[]>>
    >((acc, column) => {
      if (column.meta?.options) {
        acc[column.id ?? ""] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR,
        ).withOptions(queryStateOptions);
      } else {
        acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setPage(1);
      void setFilterValues(values);
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          filters.push({ id: key, value });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  return { columnFilters, onColumnFiltersChange };
}
