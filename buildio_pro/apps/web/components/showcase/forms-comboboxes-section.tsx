"use client";


import { Button } from "@workspace/ui/components/button";
import {
  type ComboboxOption,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@workspace/ui/components/combobox";
import { ComboboxSelect } from "@workspace/ui/components/combobox-select";
import {
  type Country,
  CountryDropdown,
} from "@workspace/ui/components/country-dropdown";
import { CurrencyPicker } from "@workspace/ui/components/currency-picker";
import * as React from "react";
import { toast } from "sonner";

import { Example, Section } from "@/components/showcase/section";

const frameworkOptions: ComboboxOption[] = [
  { value: "next", label: "Next.js", searchValue: "next react fullstack" },
  { value: "expo", label: "Expo", searchValue: "expo react native mobile" },
  { value: "convex", label: "Convex", searchValue: "convex backend database" },
  { value: "turborepo", label: "Turborepo", searchValue: "turborepo build monorepo" },
];

const selectOptions: ComboboxOption[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export function FormsComboboxesSection() {
  const [framework, setFramework] = React.useState<ComboboxOption | null>(
    frameworkOptions[0] ?? null,
  );
  const [size, setSize] = React.useState("");

  return (
    <Section
      title="Forms · Comboboxes & Pickers"
      description="Searchable selection: Base-UI combobox composition, country and currency pickers."
    >
      <Example
        title="Combobox"
        description="Composable searchable combobox (trigger, input, list, empty)."
        contentClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-64">
          <Combobox
            items={frameworkOptions}
            itemToStringLabel={(option) => option.label}
            itemToStringValue={(option) => option.searchValue ?? option.label}
            value={framework}
            onValueChange={(option) => {
              setFramework(option);
              toast.info(`Framework: ${option?.label ?? "none"}`);
            }}
          >
            <ComboboxTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                />
              }
            >
              <span className={framework ? "flex-1 truncate text-left" : "flex-1 text-left text-muted-foreground"}>
                {framework?.label ?? "Pick a framework…"}
              </span>
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxInput placeholder="Search…" showTrigger={false} showClear />
              <ComboboxEmpty>No framework found</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboboxOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </Example>

      <Example
        title="ComboboxSelect"
        description="String-value wrapper over the same combobox primitives, with clear support."
        contentClassName="flex-col items-stretch"
      >
        <ComboboxSelect
          className="w-full max-w-64"
          options={selectOptions}
          value={size}
          onValueChange={(value) => setSize(value)}
          placeholder="Pick a size"
          clearable
        />
      </Example>

      <Example
        title="CountryDropdown"
        description="Flag icons, search and slim mode. Defaults match by alpha-3 code."
        contentClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-64">
          <CountryDropdown
            defaultValue="IND"
            onChange={(country: Country) => toast.info(`Country: ${country.name}`)}
          />
        </div>
      </Example>

      <Example
        title="CurrencyPicker"
        description="Searchable currency list backed by country-data-list."
        contentClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-64">
          <CurrencyPicker
            value="INR"
            onChange={(currency) => toast.info(`Currency: ${currency.code}`)}
          />
        </div>
      </Example>
    </Section>
  );
}
