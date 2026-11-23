"use client";

import type { RowData, Column } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";

import { DataTableFilterMenuDateInput } from "@workspace/ui/components/data-table/data-table-filter-menu-date-input";
import { DataTableFilterMenuSelectInput } from "@workspace/ui/components/data-table/data-table-filter-menu-select-input";
import { DataTableRangeFilter } from "@workspace/ui/components/data-table/data-table-range-filter";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

export function onFilterInputRender<TData extends RowData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: {
  filter: ExtendedColumnFilter<TData>;
  column: Column<DataTableFeatures, TData>;
  inputId: string;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void;
  showValueSelector: boolean;
  setShowValueSelector: (value: boolean) => void;
}) {
  if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
    return (
      <div
        id={inputId}
        role="status"
        aria-label={`${column.columnDef.meta?.label} filter is ${
          filter.operator === "isEmpty" ? "empty" : "not empty"
        }`}
        aria-live="polite"
        className="h-full w-16 rounded-none border bg-transparent px-1.5 py-0.5 text-muted-foreground dark:bg-input/30"
      />
    );
  }

  switch (filter.variant) {
    case "text":
    case "number":
    case "range": {
      if (
        (filter.variant === "range" && filter.operator === "isBetween") ||
        filter.operator === "isBetween"
      ) {
        return (
          <DataTableRangeFilter
            filter={filter}
            column={column}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
            className="size-full max-w-28 gap-0 **:data-[slot='range-min']:border-r-0 [&_input]:rounded-none [&_input]:px-1.5"
          />
        );
      }

      const isNumber =
        filter.variant === "number" || filter.variant === "range";

      return (
        <Input
          id={inputId}
          type={isNumber ? "number" : "text"}
          inputMode={isNumber ? "numeric" : undefined}
          placeholder={column.columnDef.meta?.placeholder ?? "Enter value..."}
          className="h-full w-24 rounded-none px-1.5"
          defaultValue={typeof filter.value === "string" ? filter.value : ""}
          onChange={(event) =>
            onFilterUpdate(filter.filterId, { value: event.target.value })
          }
        />
      );
    }

    case "boolean": {
      const inputListboxId = `${inputId}-listbox`;

      return (
        <Select
          open={showValueSelector}
          onOpenChange={setShowValueSelector}
          value={typeof filter.value === "string" ? filter.value : "true"}
          onValueChange={(value: "true" | "false") =>
            onFilterUpdate(filter.filterId, { value })
          }
        >
          <SelectTrigger
            id={inputId}
            aria-controls={inputListboxId}
            className="rounded-none bg-transparent px-1.5 py-0.5 [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.value ? "True" : "False"} />
          </SelectTrigger>
          <SelectContent id={inputListboxId}>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    case "select":
    case "multiSelect": {
      return (
        <DataTableFilterMenuSelectInput
          filter={filter}
          column={column}
          inputId={inputId}
          onFilterUpdate={onFilterUpdate}
          showValueSelector={showValueSelector}
          setShowValueSelector={setShowValueSelector}
        />
      );
    }

    case "date":
    case "dateRange": {
      return (
        <DataTableFilterMenuDateInput
          filter={filter}
          inputId={inputId}
          onFilterUpdate={onFilterUpdate}
          showValueSelector={showValueSelector}
          setShowValueSelector={setShowValueSelector}
        />
      );
    }

    default:
      return null;
  }
}
