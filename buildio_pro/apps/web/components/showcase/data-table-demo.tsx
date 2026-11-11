"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
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

const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Title" />
    ),
    meta: { label: "Title", placeholder: "Filter titles…", variant: "text" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    meta: { label: "Status", variant: "select", options: statusOptions },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "assignee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Assignee" />
    ),
    cell: ({ row }) =>
      assigneeOptions.find((option) => option.value === row.original.assignee)
        ?.label ?? row.original.assignee,
    meta: { label: "Assignee", variant: "select", options: assigneeOptions },
    filterFn: "arrIncludesSome",
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
    pageCount: -1,
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
