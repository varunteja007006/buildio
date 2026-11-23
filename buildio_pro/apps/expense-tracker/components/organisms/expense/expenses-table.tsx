import { CardDescription, CardTitle } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@workspace/ui/components/data-table/data-table-advanced-toolbar";
import { useDataTable } from "@workspace/ui/hooks/use-data-table";
import { useQueryState } from "nuqs";
import React from "react";

import { ErrorScreen } from "@/components/atoms/error-screen";
import { FloatingLoader } from "@/components/atoms/loaders/floating-loader";
import { FilterBar } from "@/components/transactions/filter-bar";
import { useBudgetList, useExpenseCategoryList, useExpenseList } from "@/hooks";

import type { ExpenseRecord } from "./expense-table-types";
import { ExpenseTableActionBar } from "./expenses-table-action-bar";
import { expenseColumns } from "./expenses-table-columns";

export const ExpenseListTable = () => {
  const [sortBy] = React.useState<"date" | "amount">("date");
  const [sortOrder] = React.useState<"asc" | "desc">("desc");
  // Filter states
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<
    string | undefined
  >(undefined);
  const [selectedBudget, setSelectedBudget] = React.useState<
    string | undefined
  >(undefined);

  const [limit] = useQueryState("perPage", {
    defaultValue: 10,
    parse: (v) => parseInt(v, 10),
  });

  const [page, setPage] = useQueryState("page", {
    defaultValue: 1,
    parse: (v) => parseInt(v, 10),
  });

  const { data, isLoading, isError } = useExpenseList({
    limit,
    page,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    budgetId: selectedBudget === "all" ? undefined : selectedBudget,
    sortBy,
    sortOrder,
  });

  const expenses = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  // Map expenses to Transaction interface
  const transactions: ExpenseRecord[] = expenses.map((expense) => ({
    id: expense.id,
    name: expense.name,
    date: expense.transactionDate,
    amount: Number(expense.amount),
    category: expense.category
      ? { id: expense.category.id, name: expense.category.name }
      : undefined,
    budget: expense.budget
      ? { id: expense.budget.id, name: expense.budget.name }
      : undefined,
    isRecurring: expense.isRecurring ?? false,
  }));

  const { table } = useDataTable({
    data: transactions,
    columns: expenseColumns,
    pageCount: totalPages,
    getRowId: (row) => row.id,
  });

  // Fetch filters data
  const { data: categories } = useExpenseCategoryList({ limit: 100, page: 1 });
  const { data: budgets } = useBudgetList({ limit: 100, page: 1 });

  // Filter options
  const categoryOptions =
    categories?.data?.map((c) => ({ label: c.name, value: c.id })) || [];
  const budgetOptions =
    budgets?.data?.map((b) => ({ label: b.name, value: b.id })) || [];
  if (isError) {
    return <ErrorScreen />;
  }

  return (
    <>
      <div className="space-y-1">
        <CardTitle>Expenses</CardTitle>
        <CardDescription>Manage and track your expenses</CardDescription>
      </div>
      <DataTable
        table={table}
        actionBar={<ExpenseTableActionBar table={table} />}
      >
        <DataTableAdvancedToolbar table={table}>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            categories={categoryOptions}
            selectedCategory={selectedCategory}
            onCategoryChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
            }}
            budgets={budgetOptions}
            selectedBudget={selectedBudget}
            onBudgetChange={(val) => {
              setSelectedBudget(val);
              setPage(1);
            }}
            onClearFilters={() => {
              setSearch("");
              setSelectedCategory(undefined);
              setSelectedBudget(undefined);
              setPage(1);
            }}
          />
        </DataTableAdvancedToolbar>
      </DataTable>
      <FloatingLoader open={isLoading} title="Loading income records..." />
    </>
  );
};
