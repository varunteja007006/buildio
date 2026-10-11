"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxOption,
} from "@workspace/ui/components/combobox";
import { Label } from "@workspace/ui/components/label";

export function SearchableSetting({
  id,
  label,
  options,
  value,
  disabled,
  searchPlaceholder,
  emptyMessage,
  onChange,
}: {
  id: string;
  label: string;
  options: ComboboxOption[];
  value: string;
  disabled: boolean;
  searchPlaceholder: string;
  emptyMessage: string;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        items={options}
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.searchValue ?? option.label}
        value={selected}
        onValueChange={(option) => option && onChange(option.value)}
        disabled={disabled}
      >
        <ComboboxTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            {selected?.label ?? "System default"}
          </span>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder={searchPlaceholder} showTrigger={false} />
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
