"use client";

import { CalendarIcon, Check } from "lucide-react";
import * as React from "react";

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

/**
 * Standalone year picker component.
 * A searchable dropdown for year selection without form integration.
 */
interface YearPickerProps {
  value?: number;
  onChange?: (year: number | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

export function YearPicker({
  value,
  onChange,
  placeholder = "Select year...",
  searchPlaceholder = "Search year...",
  disabled = false,
  className,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 2,
}: Readonly<YearPickerProps>) {
  const [open, setOpen] = React.useState(false);

  // Generate years array (newest to oldest)
  const years = React.useMemo(() => {
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  }, [minYear, maxYear]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? value : placeholder}
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        style={{ width: "var(--anchor-width)" }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No year found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {years.map((year) => (
                <CommandItem
                  key={year}
                  value={year.toString()}
                  onSelect={() => {
                    onChange?.(year);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === year ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {year}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
