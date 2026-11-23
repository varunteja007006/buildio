"use client";

import type { RowData, Column } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { getDefaultFilterOperator } from "@workspace/ui/lib/data-table";
import { cn } from "@workspace/ui/lib/utils";
import type { ExtendedColumnFilter } from "@workspace/ui/types/data-table";

interface DataTableFilterFieldProps<TData extends RowData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column<DataTableFeatures, TData>[];
  filterId: string;
  selectedFieldId: string;
  fieldListboxId: string;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void;
}

export function DataTableFilterField<TData extends RowData>({
  open,
  onOpenChange,
  columns,
  filterId,
  selectedFieldId,
  fieldListboxId,
  onFilterUpdate,
}: DataTableFilterFieldProps<TData>) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-controls={fieldListboxId}
          variant="outline"
          size="sm"
          className="w-32 justify-between rounded font-normal"
        >
          <span className="truncate">
            {columns.find((column) => column.id === selectedFieldId)?.columnDef
              .meta?.label ?? "Select field"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent id={fieldListboxId} align="start" className="w-40 p-0">
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList>
            <CommandEmpty>No fields found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  onSelect={(value) => {
                    onFilterUpdate(filterId, {
                      id: value as Extract<keyof TData, string>,
                      variant: column.columnDef.meta?.variant ?? "text",
                      operator: getDefaultFilterOperator(
                        column.columnDef.meta?.variant ?? "text",
                      ),
                      value: "",
                    });

                    onOpenChange(false);
                  }}
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      column.id === selectedFieldId
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
