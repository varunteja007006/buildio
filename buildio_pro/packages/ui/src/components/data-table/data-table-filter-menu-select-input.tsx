"use client";

import type { RowData, Column } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Check } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

interface DataTableFilterMenuSelectInputProps<TData extends RowData> {
  filter: ExtendedColumnFilter<TData>;
  column: Column<DataTableFeatures, TData>;
  inputId: string;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void;
  showValueSelector: boolean;
  setShowValueSelector: (value: boolean) => void;
}

export function DataTableFilterMenuSelectInput<TData extends RowData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: DataTableFilterMenuSelectInputProps<TData>) {
  const inputListboxId = `${inputId}-listbox`;

  const options = column.columnDef.meta?.options ?? [];
  const selectedValues = Array.isArray(filter.value)
    ? filter.value
    : [filter.value];

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  return (
    <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          aria-controls={inputListboxId}
          variant="ghost"
          size="sm"
          className="h-full min-w-16 rounded-none border px-1.5 font-normal dark:bg-input/30"
        >
          {selectedOptions.length === 0 ? (
            filter.variant === "multiSelect" ? (
              "Select options..."
            ) : (
              "Select option..."
            )
          ) : (
            <>
              <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                {selectedOptions.map((selectedOption) =>
                  selectedOption.icon ? (
                    <div
                      key={selectedOption.value}
                      className="rounded-full border bg-background p-0.5"
                    >
                      <selectedOption.icon className="size-3.5" />
                    </div>
                  ) : null,
                )}
              </div>
              <span className="truncate">
                {selectedOptions.length > 1
                  ? `${selectedOptions.length} selected`
                  : selectedOptions[0]?.label}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent id={inputListboxId} align="start" className="w-48 p-0">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    const value =
                      filter.variant === "multiSelect"
                        ? selectedValues.includes(option.value)
                          ? selectedValues.filter((v) => v !== option.value)
                          : [...selectedValues, option.value]
                        : option.value;
                    onFilterUpdate(filter.filterId, { value });
                  }}
                >
                  {option.icon && <option.icon />}
                  <span className="truncate">{option.label}</span>
                  {filter.variant === "multiSelect" && (
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
