"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatCurrency } from "@workspace/ui/lib/currency.utils";
import { cn } from "@workspace/ui/lib/utils";
import { Eye, Loader2 } from "lucide-react";

import { TransactionDeleteDialog } from "@/components/organisms/transaction/transaction-delete-dialog";
import type { AppRouter } from "@/lib/trpc";
import { transactionTypeLabels } from "@/lib/utils/transaction.utils";

import { formatDate } from "./constants";

export type TransactionRow =
  inferRouterOutputs<AppRouter>["transaction"]["listTransactions"]["data"][number];

interface TransactionsTableProps {
  transactions: TransactionRow[];
  isLoading: boolean;
  selectedIds: Set<string>;
  selectAllChecked: boolean;
  selectAllIndeterminate: boolean;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onReview: (transaction: TransactionRow) => void;
}

export function TransactionsTable({
  transactions,
  isLoading,
  selectedIds,
  selectAllChecked,
  selectAllIndeterminate,
  onToggleSelectAll,
  onToggleSelect,
  onReview,
}: TransactionsTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectAllChecked}
                indeterminate={selectAllIndeterminate}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all transactions"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Merchant / Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Review</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-8 text-center text-muted-foreground"
              >
                <Loader2 className="mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-8 text-center text-muted-foreground"
              >
                No transactions found. Extract a statement to get started.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const isCredit = transaction.direction === "credit";
              return (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer"
                  onClick={() => onReview(transaction)}
                >
                  <TableCell
                    className="w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(transaction.id)}
                      onCheckedChange={() => onToggleSelect(transaction.id)}
                      aria-label={`Select ${transaction.merchantName ?? "transaction"}`}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(transaction.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {transaction.merchantName ?? "-"}
                    </div>
                    {transaction.description && (
                      <div className="max-w-52 truncate text-xs text-muted-foreground">
                        {transaction.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-sm">
                      {transaction.bankAccount?.name ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.category ? (
                      <Badge variant="secondary" className="font-normal">
                        {transaction.category.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {transaction.paymentMethod?.name ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {transactionTypeLabels[transaction.transactionType] ??
                        transaction.transactionType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        isCredit ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.needsReview ? (
                      <Badge variant="destructive" className="font-normal">
                        Needs review
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        Reviewed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReview(transaction);
                        }}
                      >
                        <Eye className="size-3.5" />
                        Review
                      </Button>
                      <TransactionDeleteDialog
                        transactionId={transaction.id}
                        merchantName={transaction.merchantName}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
