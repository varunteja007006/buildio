"use client";

import type { RowData, ColumnMeta } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { CalendarIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { formatDate } from "@workspace/ui/lib/format";
import { cn } from "@workspace/ui/lib/utils";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

interface DataTableFilterDateInputProps<TData extends RowData> {
  filter: ExtendedColumnFilter<TData>;
  inputId: string;
  columnMeta?: ColumnMeta<DataTableFeatures, TData, unknown>;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void;
  showValueSelector: boolean;
  setShowValueSelector: (value: boolean) => void;
}

export function DataTableFilterDateInput<TData extends RowData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: DataTableFilterDateInputProps<TData>) {
  const inputListboxId = `${inputId}-listbox`;

  const dateValue = Array.isArray(filter.value)
    ? filter.value.filter(Boolean)
    : [filter.value, filter.value].filter(Boolean);

  const startDate = dateValue[0] ? new Date(Number(dateValue[0])) : undefined;
  const endDate = dateValue[1] ? new Date(Number(dateValue[1])) : undefined;

  const isSameDate =
    startDate && endDate && startDate.toDateString() === endDate.toDateString();

  const displayValue =
    filter.operator === "isBetween" && dateValue.length === 2 && !isSameDate
      ? `${formatDate(startDate, { month: "short" })} - ${formatDate(endDate, { month: "short" })}`
      : startDate
        ? formatDate(startDate, { month: "short" })
        : "Pick a date";

  return (
    <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          aria-controls={inputListboxId}
          aria-label={`${columnMeta?.label} date filter`}
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start rounded text-left font-normal",
            !filter.value && "text-muted-foreground",
          )}
        >
          <CalendarIcon />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent id={inputListboxId} align="start" className="w-auto p-0">
        {filter.operator === "isBetween" ? (
          <Calendar
            aria-label={`Select ${columnMeta?.label} date range`}
            autoFocus
            captionLayout="dropdown"
            mode="range"
            selected={
              dateValue.length === 2
                ? {
                    from: new Date(Number(dateValue[0])),
                    to: new Date(Number(dateValue[1])),
                  }
                : {
                    from: new Date(),
                    to: new Date(),
                  }
            }
            onSelect={(date) => {
              onFilterUpdate(filter.filterId, {
                value: date
                  ? [
                      (date.from?.getTime() ?? "").toString(),
                      (date.to?.getTime() ?? "").toString(),
                    ]
                  : [],
              });
            }}
          />
        ) : (
          <Calendar
            aria-label={`Select ${columnMeta?.label} date`}
            autoFocus
            captionLayout="dropdown"
            mode="single"
            selected={dateValue[0] ? new Date(Number(dateValue[0])) : undefined}
            onSelect={(date) => {
              onFilterUpdate(filter.filterId, {
                value: (date?.getTime() ?? "").toString(),
              });
              setShowValueSelector(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
