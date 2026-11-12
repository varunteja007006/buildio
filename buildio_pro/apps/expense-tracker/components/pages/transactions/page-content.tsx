"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import {
  TransactionReviewDialog,
  type ReviewTransaction,
} from "@/components/organisms/transaction/transaction-review-dialog";
import {
  useBankAccountList,
  useExpenseCategoryList,
  usePaymentMethodList,
  useStatementList,
  useTransactionList,
  type TransactionDirection,
  type TransactionType,
} from "@/hooks";

import { ActiveFilterChips } from "./active-filter-chips";
import { TransactionsBulkActions } from "./transactions-bulk-actions";
import { TransactionsFilterToolbar } from "./transactions-filter-toolbar";
import { TransactionsPagination } from "./transactions-pagination";
import { TransactionsTable } from "./transactions-table";
import {
  buildActiveFilterChips,
  useTransactionFilters,
} from "./use-transaction-filters";

export function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const {
    filters,
    update,
    reset,
    page,
    setPage,
    limit,
    setLimit,
    hasActiveFilters,
    advancedFilterCount,
  } = useTransactionFilters(searchParams.get("statementUploadId") ?? "");

  const [reviewing, setReviewing] = React.useState<ReviewTransaction | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(),
  );

  const filterKey = [
    filters.statementUploadId,
    filters.bankAccountId,
    filters.categoryId,
    filters.paymentMethodId,
    filters.transactionType,
    filters.direction,
    filters.search,
    filters.markForReviewOnly,
    filters.startDate,
    filters.endDate,
  ].join("|");

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [filterKey]);

  const { data, isLoading } = useTransactionList({
    limit,
    page,
    bankAccountId: filters.bankAccountId || undefined,
    statementUploadId: filters.statementUploadId || undefined,
    categoryId: filters.categoryId || undefined,
    paymentMethodId: filters.paymentMethodId || undefined,
    transactionType: (filters.transactionType as TransactionType) || undefined,
    direction: (filters.direction as TransactionDirection) || undefined,
    search: filters.search || undefined,
    startDate: filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : undefined,
    endDate: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : undefined,
    markForReviewOnly: filters.markForReviewOnly,
  });

  const { data: statementsData } = useStatementList({ limit: 100, page: 1 });
  const { data: categoriesData } = useExpenseCategoryList({
    limit: 100,
    page: 1,
  });
  const { data: paymentMethods } = usePaymentMethodList();
  const { data: bankAccounts } = useBankAccountList();

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = transactions.map((transaction) => transaction.id);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const pageSelectedCount = transactions.filter((transaction) =>
    selectedIds.has(transaction.id),
  ).length;
  const selectAllChecked = transactions.length === 0 ? false : pageSelectedCount === transactions.length;
  const selectAllIndeterminate =
    pageSelectedCount > 0 && pageSelectedCount < transactions.length;

  const selectedStatement = statementsData?.data.find(
    (statement) => statement.id === filters.statementUploadId,
  );
  const selectedAccount = bankAccounts?.find(
    (account) => account.id === filters.bankAccountId,
  );
  const selectedCategory = categoriesData?.data.find(
    (category) => category.id === filters.categoryId,
  );
  const selectedPaymentMethod = paymentMethods?.find(
    (method) => method.id === filters.paymentMethodId,
  );

  const chips = buildActiveFilterChips({
    filters,
    selected: {
      statement: selectedStatement,
      account: selectedAccount,
      category: selectedCategory,
      paymentMethod: selectedPaymentMethod,
    },
    update,
  });

  const statementOptions =
    statementsData?.data.map((statement) => ({
      id: statement.id,
      label: statement.originalFilename,
    })) ?? [];
  const bankAccountOptions =
    bankAccounts?.map((account) => ({
      id: account.id,
      label: `${account.bankName}${account.lastFour ? ` ••${account.lastFour}` : ""}`,
    })) ?? [];
  const categoryOptions =
    categoriesData?.data.map((category) => ({
      id: category.id,
      label: category.name,
    })) ?? [];
  const paymentMethodOptions =
    paymentMethods?.map((method) => ({ id: method.id, label: method.name })) ??
    [];

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3">
            <TransactionsFilterToolbar
              filters={filters}
              search={filters.search}
              onSearchChange={(value) => update({ search: value })}
              onDirectionChange={(value) => update({ direction: value })}
              onReviewOnlyChange={(pressed) =>
                update({ markForReviewOnly: pressed })
              }
              onFilterChange={update}
              onReset={reset}
              hasActiveFilters={hasActiveFilters}
              advancedFilterCount={advancedFilterCount}
              statements={statementOptions}
              bankAccounts={bankAccountOptions}
              categories={categoryOptions}
              paymentMethods={paymentMethodOptions}
            />
            <ActiveFilterChips chips={chips} onClearAll={reset} />
          </div>

          <TransactionsTable
            transactions={transactions}
            isLoading={isLoading}
            selectedIds={selectedIds}
            selectAllChecked={selectAllChecked}
            selectAllIndeterminate={selectAllIndeterminate}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onReview={(transaction) => setReviewing(transaction)}
          />

          <TransactionsPagination
            meta={meta}
            limit={limit}
            onLimitChange={setLimit}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <TransactionsBulkActions
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <TransactionReviewDialog
        transaction={reviewing}
        open={Boolean(reviewing)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewing(null);
          }
        }}
      />
    </div>
  );
}
