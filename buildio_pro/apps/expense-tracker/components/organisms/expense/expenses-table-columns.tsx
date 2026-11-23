import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import {
  DataTableSelectPage,
  DataTableSelectRow,
} from "@workspace/ui/components/data-table/data-table-selection";

import {
  ExpenseDeleteDialog,
  ExpenseDetailsComponent,
  ExpenseFormComponent,
} from ".";
import type { ExpenseRecord } from "./expense-table-types";

export const expenseColumns: ColumnDef<DataTableFeatures, ExpenseRecord>[] = [
  {
    id: "select",
    header: ({ table }) => <DataTableSelectPage table={table} />,
    cell: ({ row }) => <DataTableSelectRow row={row} />,
    size: 32,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  { accessorKey: "amount", header: "Amount" },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return row.original.category?.name || "-";
    },
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => {
      return row.original.budget?.name || "-";
    },
  },
  {
    accessorKey: "date",
    header: "Transaction Date",
    cell: ({ row }) => {
      const val = row.original.date;
      return new Date(val).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const expense = row.original;

      return (
        <div className="flex justify-start gap-2">
          <ExpenseDetailsComponent expenseId={expense.id} />
          <ExpenseFormComponent
            mode="edit"
            initialValues={{
              name: expense.name,
              amount: expense.amount.toString(),
              categoryId: expense.category?.id,
              budgetId: expense.budget?.id,
              isRecurring: expense.isRecurring,
            }}
            expenseId={expense.id}
          />
          <ExpenseDeleteDialog expenseId={expense.id} />
        </div>
      );
    },
    enableSorting: false,
  },
];
