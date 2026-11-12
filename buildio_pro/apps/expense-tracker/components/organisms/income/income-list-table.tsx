import { ColumnDef, Table } from "@tanstack/react-table";
import { ActionBar } from "@workspace/ui/components/action-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DataTable } from "@workspace/ui/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@workspace/ui/components/data-table/data-table-advanced-toolbar";
import { useDataTable } from "@workspace/ui/hooks/use-data-table";
import { Trash2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";

import { ErrorScreen } from "@/components/atoms/error-screen";
import { FloatingLoader } from "@/components/atoms/loaders/floating-loader";
import { useDeleteIncomes, useIncomeList } from "@/hooks";

import { IncomeDeleteDialog, IncomeDetails, IncomeForm } from ".";

type IncomeRecord = {
  id: string;
  name: string | null;
  amount: number;
  createdAt: Date;
  sourceId?: string | null;
};

const columns: ColumnDef<IncomeRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
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
    accessorKey: "name",
    header: "Name",
  },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const val = row.original.createdAt;
      return new Date(val).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const income = row.original;
      return (
        <div className="flex justify-start gap-2">
          <IncomeDetails incomeId={income.id} />
          <IncomeForm
            mode="edit"
            incomeId={income.id}
            initialValues={{
              name: income.name || "",
              amount: String(income.amount),
              sourceId: income.sourceId || undefined,
            }}
          />
          <IncomeDeleteDialog incomeId={income.id} />
        </div>
      );
    },
    enableSorting: false,
  },
];

export const IncomeListTable = () => {
  const [limit] = useQueryState("perPage", {
    defaultValue: 10,
    parse: (v) => parseInt(v, 10),
  });

  const [page] = useQueryState("page", {
    defaultValue: 1,
    parse: (v) => parseInt(v, 10),
  });

  const { data, isLoading, isError } = useIncomeList({
    limit,
    page,
  });

  const incomes = data?.data || [];
  const totalPages = data?.meta?.totalPages ?? 0;

  const records: IncomeRecord[] = incomes.map((income) => ({
    id: income.id,
    name: income.name,
    amount: income.amount,
    createdAt: income.transactionDate,
    sourceId: income.sourceId,
  }));

  const { table } = useDataTable({
    data: records,
    columns,
    pageCount: totalPages,
  });

  if (isError) {
    return <ErrorScreen />;
  }

  return (
    <>
      <DataTable table={table} actionBar={<TableActionBar table={table} />}>
        <DataTableAdvancedToolbar table={table}></DataTableAdvancedToolbar>
      </DataTable>
      <FloatingLoader open={isLoading} title="Loading income records..." />
    </>
  );
};

function TableActionBar({ table }: { table: Table<IncomeRecord> }) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false);
      }
    },
    [table],
  );

  const deleteIncomes = useDeleteIncomes({
    onSuccess: () => {
      table.toggleAllRowsSelected(false);
    },
  });

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      {/* Add your custom actions here */}
      <p className="text-sm">Delete {rows.length} selected items</p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={rows.length === 0}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteIncomes.mutate({
                    incomeIds: rows.map((item) => item.original.id),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {rows.length} items
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ActionBar>
  );
}
