"use client";

import type { RowData, Column } from "@tanstack/react-table";
import type { DataTableFeatures } from "@workspace/ui/config/data-table-features";
import { BadgeCheck, Text } from "lucide-react";
import * as React from "react";

import { Calendar } from "@workspace/ui/components/calendar";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";

interface DataTableFilterMenuFieldPickerProps<TData extends RowData> {
  columns: Column<DataTableFeatures, TData>[];
  selectedColumn: Column<DataTableFeatures, TData> | null;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelectColumn: (column: Column<DataTableFeatures, TData>) => void;
  onFilterAdd: (
    column: Column<DataTableFeatures, TData>,
    value: string,
  ) => void;
}

export function DataTableFilterMenuFieldPicker<TData extends RowData>({
  columns,
  selectedColumn,
  inputValue,
  onInputValueChange,
  onInputKeyDown,
  onSelectColumn,
  onFilterAdd,
}: DataTableFilterMenuFieldPickerProps<TData>) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleColumnSelect = React.useCallback(
    (column: Column<DataTableFeatures, TData>) => {
      onSelectColumn(column);
      onInputValueChange("");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [onSelectColumn, onInputValueChange],
  );

  return (
    <>
      <CommandInput
        ref={inputRef}
        placeholder={
          selectedColumn
            ? (selectedColumn.columnDef.meta?.label ?? selectedColumn.id)
            : "Search fields..."
        }
        value={inputValue}
        onValueChange={onInputValueChange}
        onKeyDown={onInputKeyDown}
      />
      <CommandList>
        {selectedColumn ? (
          <>
            {selectedColumn.columnDef.meta?.options && (
              <CommandEmpty>No options found.</CommandEmpty>
            )}
            <FilterValueSelector
              column={selectedColumn}
              value={inputValue}
              onSelect={(value) => onFilterAdd(selectedColumn, value)}
            />
          </>
        ) : (
          <>
            <CommandEmpty>No fields found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  onSelect={() => handleColumnSelect(column)}
                >
                  {column.columnDef.meta?.icon && (
                    <column.columnDef.meta.icon />
                  )}
                  <span className="truncate">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  );
}

interface FilterValueSelectorProps<TData extends RowData> {
  column: Column<DataTableFeatures, TData>;
  value: string;
  onSelect: (value: string) => void;
}

function FilterValueSelector<TData extends RowData>({
  column,
  value,
  onSelect,
}: FilterValueSelectorProps<TData>) {
  const variant = column.columnDef.meta?.variant ?? "text";

  switch (variant) {
    case "boolean":
      return (
        <CommandGroup>
          <CommandItem value="true" onSelect={() => onSelect("true")}>
            True
          </CommandItem>
          <CommandItem value="false" onSelect={() => onSelect("false")}>
            False
          </CommandItem>
        </CommandGroup>
      );

    case "select":
    case "multiSelect":
      return (
        <CommandGroup>
          {column.columnDef.meta?.options?.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={() => onSelect(option.value)}
            >
              {option.icon && <option.icon />}
              <span className="truncate">{option.label}</span>
              {option.count && (
                <span className="ml-auto font-mono text-xs">
                  {option.count}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      );

    case "date":
    case "dateRange":
      return (
        <Calendar
          autoFocus
          captionLayout="dropdown"
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onSelect(date?.getTime().toString() ?? "")}
        />
      );

    default: {
      const isEmpty = !value.trim();

      return (
        <CommandGroup>
          <CommandItem
            value={value}
            onSelect={() => onSelect(value)}
            disabled={isEmpty}
          >
            {isEmpty ? (
              <>
                <Text />
                <span>Type to add filter...</span>
              </>
            ) : (
              <>
                <BadgeCheck />
                <span className="truncate">Filter by &quot;{value}&quot;</span>
              </>
            )}
          </CommandItem>
        </CommandGroup>
      );
    }
  }
}
