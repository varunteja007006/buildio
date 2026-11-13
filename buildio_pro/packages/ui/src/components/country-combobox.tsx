"use client";

import { countries } from "country-data-list";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import React, { useMemo } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Country interface from country-data-list
 */
export interface Country {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
}

/**
 * Unified country combobox component for forms.
 *
 * Features:
 * - Full-text search functionality for country names
 * - Display country with flag emoji
 * - Form integration with react-hook-form
 * - Customizable placeholder and empty state
 * - Filtering options (deleted countries, North Korea)
 * - Optional selection change callback
 *
 * @example
 * ```tsx
 * <CountryCombobox
 *   control={form.control}
 *   name="country"
 *   label="Select Country"
 * />
 * ```
 */

interface CountryComboboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // Form related props
  control: Control<TFieldValues>;
  name: TName;

  // Component props
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  description?: string;
  required?: boolean;

  // Options customization
  includeDeleted?: boolean;
  includePRK?: boolean;
  customCountries?: Country[];

  // Callbacks
  onSelectionChange?: (country: Country | undefined) => void;

  // Styling
  className?: string;
  disabled?: boolean;

  // Display options
  showFlag?: boolean;
  showCallingCode?: boolean;
}

export default function CountryCombobox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder = "Select a country",
  searchPlaceholder = "Search countries...",
  description,
  required = false,
  includeDeleted = false,
  includePRK = false,
  customCountries,
  onSelectionChange,
  className,
  disabled = false,
  showFlag = true,
  showCallingCode = false,
}: Readonly<CountryComboboxProps<TFieldValues, TName>>) {
  const [open, setOpen] = React.useState(false);

  // Memoize filtered countries list
  const countryOptions = useMemo(() => {
    const list = customCountries || countries.all;

    return (list as Country[]).filter((country) => {
      if (country.status === "deleted" && !includeDeleted) return false;
      if (country.ioc === "PRK" && !includePRK) return false;
      if (!showFlag && !country.emoji) return false;
      return true;
    });
  }, [customCountries, includeDeleted, includePRK, showFlag]);

  const getDisplayValue = (value: string): React.ReactNode => {
    if (!value) {
      return (
        <span className="flex items-center gap-2 text-muted-foreground">
          {showFlag && <Globe className="h-4 w-4" />}
          {placeholder}
        </span>
      );
    }

    const selectedCountry = countryOptions.find(
      (country) => country.alpha3 === value,
    );

    if (!selectedCountry) {
      return placeholder;
    }

    return (
      <span className="flex items-center gap-2">
        {showFlag && selectedCountry.emoji && (
          <span className="text-lg">{selectedCountry.emoji}</span>
        )}
        <span>{selectedCountry.name}</span>
        {showCallingCode && selectedCountry.countryCallingCodes[0] && (
          <span className="text-xs text-muted-foreground">
            {selectedCountry.countryCallingCodes[0]}
          </span>
        )}
      </span>
    );
  };

  const handleSelect = (selectedValue: string) => {
    const selectedCountry = countryOptions.find(
      (country) => country.alpha3 === selectedValue,
    );
    setOpen(false);
    onSelectionChange?.(selectedCountry);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  aria-expanded={open}
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {getDisplayValue(field.value)}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="p-0"
              align="start"
              sideOffset={4}
              style={{ width: "var(--anchor-width)" }}
            >
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countryOptions.map((country) => (
                      <CommandItem
                        key={country.alpha3}
                        value={country.name}
                        onSelect={() => {
                          field.onChange(country.alpha3);
                          handleSelect(country.alpha3);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            country.alpha3 === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {showFlag && country.emoji && (
                          <span className="mr-2 text-lg">{country.emoji}</span>
                        )}
                        <span>{country.name}</span>
                        {showCallingCode && country.countryCallingCodes[0] && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {country.countryCallingCodes[0]}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
