"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox";
import { useState } from "react";

import { pinCodesQuery } from "@/api/merchants/query";
import type { City } from "@/api/merchants/types";

export function PinCodeFilter({
  city,
  value,
  onChange,
}: {
  city: City;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const anchorRef = useComboboxAnchor();
  const [requested, setRequested] = useState(false);
  const { data, isError, isPending, refetch } = useQuery({
    ...pinCodesQuery(city),
    enabled: requested,
  });

  return (
    <div>
      <label htmlFor="pin-code">PIN codes</label>
      <Combobox
        multiple
        items={data ?? []}
        value={value}
        onValueChange={onChange}
        onOpenChange={(open) => {
          if (!open) return;
          setRequested(true);
          if (isError) void refetch();
        }}
      >
        <ComboboxChips className="pin-field" ref={anchorRef}>
          {value.map((code) => (
            <ComboboxChip className="pin-chip" key={code}>
              {code}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            className="pin-input"
            id="pin-code"
            inputMode="numeric"
            placeholder={
              value.length ? "Add PIN code" : "Search or select PIN codes"
            }
          />
          <ComboboxTrigger
            className="pin-trigger"
            type="button"
            aria-label="Show PIN codes"
          />
        </ComboboxChips>
        <ComboboxContent className="pin-popup" anchor={anchorRef}>
          <ComboboxEmpty className="pin-empty">
            {isPending
              ? "Loading PIN codes…"
              : isError
                ? "Couldn’t load PIN codes. Reopen to retry."
                : "No matching PIN codes"}
          </ComboboxEmpty>
          <ComboboxList className="pin-list">
            {(code: string) => (
              <ComboboxItem className="pin-option" key={code} value={code}>
                {code}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
