"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

import { runViewTransition } from "./run-view-transition";

export function PalettePicker({
  palettes,
}: {
  palettes: readonly (readonly [string, string])[];
}) {
  const [palette, setPalette] = useState("default");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.showcasePalette = palette;
    return () => {
      delete root.dataset.showcasePalette;
    };
  }, [palette]);

  return (
    <Select
      value={palette}
      onValueChange={(value) =>
        value && runViewTransition(() => setPalette(value))
      }
    >
      <SelectTrigger
        aria-label="Choose showcase color palette"
        className="w-44"
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2">
            <Palette aria-hidden="true" />
            <span className="truncate">
              {palettes.find(([name]) => name === palette)?.[1] ?? palette}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="end"
        sideOffset={4}
        className="max-h-[min(20rem,var(--available-height))] min-w-(--anchor-width) scrollbar-thin"
      >
        {palettes.map(([name, label]) => (
          <SelectItem key={name} value={name}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
