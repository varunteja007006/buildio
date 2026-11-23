import type { Table } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
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
import { Trash2 } from "lucide-react";
import React from "react";

import { useDeleteExpenses } from "@/hooks";

import type { ExpenseRecord } from "./expense-table-types";

export function ExpenseTableActionBar({
  table,
}: {
  table: Table<DataTableFeatures, ExpenseRecord>;
}) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.resetRowSelection(true);
      }
    },
    [table],
  );

  const deleteExpenses = useDeleteExpenses({
    onSuccess: () => {
      table.resetRowSelection(true);
    },
  });

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
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
                  deleteExpenses.mutate({
                    expenseIds: rows.map((item) => item.original.id),
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
