"use client";

// data
import { currencies as AllCurrencies } from "country-data-list";
// assets
import { CheckIcon, ChevronDown, DollarSign } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// shadcn
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
// utils
import { cn } from "@workspace/ui/lib/utils";

export interface Currency {
  code: string;
  decimals: number;
  name: string;
  number: string;
  symbol?: string;
}

interface CurrencyPickerProps {
  value?: string;
  onChange?: (currency: Currency) => void;
  onValueChange?: (value: string) => void;
  mode?: "combobox" | "select";
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  slim?: boolean;
  showSymbol?: boolean;
  className?: string;
  options?: Currency[];
  ref?: React.Ref<HTMLDivElement>;
  name?: string;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
}

/**
 * Unified currency picker with configurable UI styles.
 * Supports both combobox (searchable popover) and select (native dropdown) modes.
 */
export function CurrencyPicker({
  value,
  onChange,
  onValueChange,
  mode = "combobox",
  placeholder = "Select a currency",
  searchPlaceholder = "Search currency...",
  disabled = false,
  slim = false,
  showSymbol = true,
  className,
  options,
  id,
  name,
  onBlur,
}: Readonly<CurrencyPickerProps>) {
  const [open, setOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<
    Currency | undefined
  >(undefined);

  // Memoize unique currencies
  const uniqueCurrencies = React.useMemo<Currency[]>(() => {
    if (options) return options;

    const currencyMap = new Map<string, Currency>();

    AllCurrencies.all.forEach((currency: Currency) => {
      if (currency.code && currency.name && currency.symbol) {
        if (currency.code === "EUR") {
          currencyMap.set(currency.code, {
            code: currency.code,
            name: "Euro",
            symbol: currency.symbol,
            decimals: currency.decimals,
            number: currency.number,
          });
        } else {
          currencyMap.set(currency.code, {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            decimals: currency.decimals,
            number: currency.number,
          });
        }
      }
    });

    return Array.from(currencyMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [options]);

  useEffect(() => {
    if (value) {
      const initial = uniqueCurrencies.find((c) => c.code === value);
      if (initial) {
        setSelectedCurrency(initial);
      }
    }
  }, [value, uniqueCurrencies]);

  const handleSelect = useCallback(
    (currency: Currency) => {
      setSelectedCurrency(currency);
      onChange?.(currency);
      onValueChange?.(currency.code);
      setOpen(false);
    },
    [onChange, onValueChange],
  );

  // Combobox Mode
  if (mode === "combobox") {
    const triggerClasses = cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      slim && "w-24",
      className,
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={triggerClasses} disabled={disabled} asChild>
          <button type="button" id={id} name={name} aria-haspopup="listbox">
            {selectedCurrency ? (
              <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
                {showSymbol && (
                  <span className="shrink-0 font-semibold text-muted-foreground">
                    {selectedCurrency.symbol}
                  </span>
                )}
                {!slim && (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedCurrency.code} - {selectedCurrency.name}
                  </span>
                )}
                {slim && (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedCurrency.code}
                  </span>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-2">
                {!slim ? (
                  placeholder
                ) : (
                  <DollarSign size={16} className="text-muted-foreground" />
                )}
              </span>
            )}
            <ChevronDown size={16} className="shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          collisionPadding={10}
          side="bottom"
          className="p-0"
          style={{ width: "var(--anchor-width)" }}
        >
          <Command className="w-full max-h-[200px] sm:max-h-[270px]">
            <CommandList>
              <div className="sticky top-0 z-10 bg-popover">
                <CommandInput placeholder={searchPlaceholder} />
              </div>
              <CommandEmpty>No currency found.</CommandEmpty>
              <CommandGroup>
                {uniqueCurrencies.map((currency) => (
                  <CommandItem
                    className="flex items-center w-full gap-2"
                    key={currency.code}
                    onSelect={() => handleSelect(currency)}
                    value={`${currency.code} ${currency.name}`}
                  >
                    <div className="flex flex-grow w-0 items-center gap-2 overflow-hidden">
                      <span className="shrink-0 font-semibold text-muted-foreground w-8">
                        {currency.symbol}
                      </span>
                      <span className="shrink-0 text-sm font-medium w-10">
                        {currency.code}
                      </span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                        {currency.name}
                      </span>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        currency.code === selectedCurrency?.code
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

  // Select Mode (default)
  return (
    <Select
      value={value || ""}
      onValueChange={(code) => {
        const currency = uniqueCurrencies.find((c) => c.code === code);
        if (currency) {
          handleSelect(currency);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)} onBlur={onBlur}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {uniqueCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center w-full gap-2">
                <span className="text-sm text-muted-foreground w-8 text-left">
                  {currency.code}
                </span>
                {showSymbol && (
                  <span className="text-muted-foreground">
                    {currency.symbol}
                  </span>
                )}
                <span>{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
