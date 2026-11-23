"use client";

import type { RowData, ColumnSort, ReactTable } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import * as React from "react";

import {
  REMOVE_SORT_SHORTCUTS,
  SORT_SHORTCUT_KEY,
} from "@workspace/ui/components/data-table/data-table-sort-list-utils";

export function useDataTableSortList<TData extends RowData>(
  table: ReactTable<DataTableFeatures, TData>,
) {
  const [open, setOpen] = React.useState(false);

  const sorting = table.state.sorting;
  const onSortingChange = table.setSorting;

  const { columnLabels, columns } = React.useMemo(() => {
    const labels = new Map<string, string>();
    const sortingIds = new Set(sorting.map((s) => s.id));
    const availableColumns: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue;

      const label = column.columnDef.meta?.label ?? column.id;
      labels.set(column.id, label);

      if (!sortingIds.has(column.id)) {
        availableColumns.push({ id: column.id, label });
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
    };
  }, [sorting, table]);

  const onSortAdd = React.useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) return;

    onSortingChange((prevSorting) => [
      ...prevSorting,
      { id: firstColumn.id, desc: false },
    ]);
  }, [columns, onSortingChange]);

  const onSortUpdate = React.useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      onSortingChange((prevSorting) => {
        if (!prevSorting) return prevSorting;
        return prevSorting.map((sort) =>
          sort.id === sortId ? { ...sort, ...updates } : sort,
        );
      });
    },
    [onSortingChange],
  );

  const onSortRemove = React.useCallback(
    (sortId: string) => {
      onSortingChange((prevSorting) =>
        prevSorting.filter((item) => item.id !== sortId),
      );
    },
    [onSortingChange],
  );

  const onSortingReset = React.useCallback(
    () => onSortingChange(table.initialState.sorting),
    [onSortingChange, table.initialState.sorting],
  );

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
        event.key.toLowerCase() === SORT_SHORTCUT_KEY &&
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
        REMOVE_SORT_SHORTCUTS.includes(event.key.toLowerCase()) &&
        sorting.length > 0
      ) {
        event.preventDefault();
        onSortingReset();
      }
    },
    [sorting.length, onSortingReset],
  );

  return {
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
  };
}
