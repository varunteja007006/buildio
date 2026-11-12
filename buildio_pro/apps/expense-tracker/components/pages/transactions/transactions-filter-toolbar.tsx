"use client";

import { Toggle } from "@workspace/ui/components/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
} from "lucide-react";

import { SearchInput } from "@/components/atoms/search-input";

import { TransactionsFilterPopover } from "./transactions-filter-popover";
import type { TransactionFilters } from "./use-transaction-filters";

interface FilterOption {
  id: string;
  label: string;
}

interface TransactionsFilterToolbarProps {
  filters: TransactionFilters;
  search: string;
  onSearchChange: (value: string) => void;
  onDirectionChange: (value: string) => void;
  onReviewOnlyChange: (pressed: boolean) => void;
  onFilterChange: (patch: Partial<TransactionFilters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  advancedFilterCount: number;
  statements?: FilterOption[];
  bankAccounts?: FilterOption[];
  categories?: FilterOption[];
  paymentMethods?: FilterOption[];
}

export function TransactionsFilterToolbar({
  filters,
  search,
  onSearchChange,
  onDirectionChange,
  onReviewOnlyChange,
  onFilterChange,
  onReset,
  hasActiveFilters,
  advancedFilterCount,
  statements,
  bankAccounts,
  categories,
  paymentMethods,
}: TransactionsFilterToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        placeholder="Search merchant, description, ref..."
        className="min-w-52 flex-1"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <ToggleGroup
        variant="outline"
        size="sm"
        value={filters.direction ? [filters.direction] : ["all"]}
        onValueChange={(value) => {
          if (!value[0]) return;
          onDirectionChange(value[0] === "all" ? "" : value[0]);
        }}
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem
          value="debit"
          className="gap-1 data-pressed:text-red-600"
        >
          <ArrowUpRight className="size-3.5" />
          Debit
        </ToggleGroupItem>
        <ToggleGroupItem
          value="credit"
          className="gap-1 data-pressed:text-green-600"
        >
          <ArrowDownRight className="size-3.5" />
          Credit
        </ToggleGroupItem>
      </ToggleGroup>

      <Toggle
        variant="outline"
        size="sm"
        pressed={filters.markForReviewOnly}
        onPressedChange={onReviewOnlyChange}
        className="gap-1.5 data-pressed:border-amber-500/60 data-pressed:bg-amber-500/10 data-pressed:text-amber-700 dark:data-pressed:text-amber-400"
      >
        <CircleAlert className="size-3.5" />
        Needs review
      </Toggle>

      <TransactionsFilterPopover
        filters={filters}
        statements={statements}
        bankAccounts={bankAccounts}
        categories={categories}
        paymentMethods={paymentMethods}
        onChange={onFilterChange}
        onReset={onReset}
        hasActiveFilters={hasActiveFilters}
        advancedFilterCount={advancedFilterCount}
      />
    </div>
  );
}
