"use client";

import type { Row, RowData, Table } from "@tanstack/react-table";

import { Checkbox } from "@workspace/ui/components/checkbox";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";

export function DataTableSelectPage<TData extends RowData>({
  table,
  label = "Select all",
}: {
  table: Table<DataTableFeatures, TData>;
  label?: string;
}) {
  "use no memo";

  const allSelected = table.getIsAllPageRowsSelected();

  return (
    <Checkbox
      checked={allSelected}
      indeterminate={!allSelected && table.getIsSomePageRowsSelected()}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      aria-label={label}
    />
  );
}

export function DataTableSelectRow<TData extends RowData>({
  row,
  label = "Select row",
}: {
  row: Row<DataTableFeatures, TData>;
  label?: string;
}) {
  "use no memo";

  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => row.toggleSelected(checked)}
      aria-label={label}
    />
  );
}
