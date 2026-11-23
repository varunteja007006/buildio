"use client";

import type { RowData, ColumnMeta } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";

import { Button } from "@workspace/ui/components/button";
import {
  Faceted,
  FacetedBadgeList,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedList,
  FacetedTrigger,
} from "@workspace/ui/components/faceted";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

interface DataTableFilterSelectInputProps<TData extends RowData> {
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

export function DataTableFilterSelectInput<TData extends RowData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: DataTableFilterSelectInputProps<TData>) {
  const inputListboxId = `${inputId}-listbox`;

  const multiple = filter.variant === "multiSelect";
  const selectedValues = multiple
    ? Array.isArray(filter.value)
      ? filter.value
      : []
    : typeof filter.value === "string"
      ? filter.value
      : undefined;

  return (
    <Faceted
      open={showValueSelector}
      onOpenChange={setShowValueSelector}
      value={selectedValues}
      onValueChange={(value) => {
        onFilterUpdate(filter.filterId, {
          value,
        });
      }}
      multiple={multiple}
    >
      <FacetedTrigger asChild>
        <Button
          id={inputId}
          aria-controls={inputListboxId}
          aria-label={`${columnMeta?.label} filter value${multiple ? "s" : ""}`}
          variant="outline"
          size="sm"
          className="w-full rounded font-normal"
        >
          <FacetedBadgeList
            options={columnMeta?.options}
            placeholder={
              columnMeta?.placeholder ??
              `Select option${multiple ? "s" : ""}...`
            }
          />
        </Button>
      </FacetedTrigger>
      <FacetedContent id={inputListboxId} className="w-[200px]">
        <FacetedInput
          aria-label={`Search ${columnMeta?.label} options`}
          placeholder={columnMeta?.placeholder ?? "Search options..."}
        />
        <FacetedList>
          <FacetedEmpty>No options found.</FacetedEmpty>
          <FacetedGroup>
            {columnMeta?.options?.map((option) => (
              <FacetedItem key={option.value} value={option.value}>
                {option.icon && <option.icon />}
                <span>{option.label}</span>
                {option.count && (
                  <span className="ml-auto font-mono text-xs">
                    {option.count}
                  </span>
                )}
              </FacetedItem>
            ))}
          </FacetedGroup>
        </FacetedList>
      </FacetedContent>
    </Faceted>
  );
}
