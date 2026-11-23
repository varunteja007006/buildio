"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Badge } from "@workspace/ui/components/badge";
import {
  DataTableSelectPage,
  DataTableSelectRow,
} from "@workspace/ui/components/data-table/data-table-selection";
import { DataTable } from "@workspace/ui/components/data-table/data-table";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@workspace/ui/components/data-table/data-table-toolbar";
import { useDataTable } from "@workspace/ui/hooks/use-data-table";
import type { Option } from "@workspace/ui/types/data-table";

type Status = "todo" | "in-progress" | "done" | "blocked";

type Task = {
  id: string;
  title: string;
  status: Status;
  assignee: string;
  createdAt: string;
};

const statusOptions: Option[] = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in-progress" },
  { label: "Done", value: "done" },
  { label: "Blocked", value: "blocked" },
];

const assigneeOptions: Option[] = [
  { label: "Ada Lovelace", value: "ada" },
  { label: "Grace Hopper", value: "grace" },
  { label: "Alan Turing", value: "alan" },
];

const statusBadgeVariant: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  todo: "outline",
  "in-progress": "secondary",
  done: "default",
  blocked: "destructive",
};

const tasks: Task[] = [
  { id: "T-01", title: "Ship the design tokens package", status: "done", assignee: "ada", createdAt: "2026-10-02" },
  { id: "T-02", title: "Migrate select to Base-UI", status: "in-progress", assignee: "grace", createdAt: "2026-10-14" },
  { id: "T-03", title: "Add RTL support to menus", status: "todo", assignee: "alan", createdAt: "2026-10-20" },
  { id: "T-04", title: "Fix calendar a11y labels", status: "blocked", assignee: "ada", createdAt: "2026-10-21" },
  { id: "T-05", title: "Write data-table docs", status: "in-progress", assignee: "grace", createdAt: "2026-10-27" },
  { id: "T-06", title: "Benchmark chart re-renders", status: "todo", assignee: "alan", createdAt: "2026-11-01" },
  { id: "T-07", title: "Audit focus rings across themes", status: "done", assignee: "ada", createdAt: "2026-11-03" },
  { id: "T-08", title: "Add skeleton presets", status: "todo", assignee: "grace", createdAt: "2026-11-05" },
  { id: "T-09", title: "Polyfill scroll-area on Safari 17", status: "blocked", assignee: "alan", createdAt: "2026-11-06" },
  { id: "T-10", title: "Publish carousel plugins guide", status: "in-progress", assignee: "ada", createdAt: "2026-11-08" },
];

const filterByOption: FilterFn<DataTableFeatures, Task> = (
  row,
  columnId,
  values: string[],
) => values.includes(row.getValue<string>(columnId));

const columns: ColumnDef<DataTableFeatures, Task>[] = [
  {
    id: "select",
    header: ({ table }) => <DataTableSelectPage table={table} />,
    cell: ({ row }) => <DataTableSelectRow row={row} />,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
  },
  {
    id: "title",
    accessorKey: "title",
    enableColumnFilter: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Title" />
    ),
    meta: { label: "Title", placeholder: "Filter titles…", variant: "text" },
  },
  {
    id: "status",
    accessorKey: "status",
    enableColumnFilter: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    meta: { label: "Status", variant: "select", options: statusOptions },
    filterFn: filterByOption,
  },
  {
    id: "assignee",
    accessorKey: "assignee",
    enableColumnFilter: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Assignee" />
    ),
    cell: ({ row }) =>
      assigneeOptions.find((option) => option.value === row.original.assignee)
        ?.label ?? row.original.assignee,
    meta: { label: "Assignee", variant: "select", options: assigneeOptions },
    filterFn: filterByOption,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => row.original.createdAt,
  },
];

export function DataTableDemo() {
  const { table } = useDataTable({
    data: tasks,
    columns,
    getRowId: (row) => row.id,
    manualFiltering: false,
    manualPagination: false,
    manualSorting: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
