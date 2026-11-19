"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Palette } from "lucide-react";
import * as React from "react";

import { PALETTE_THEMES } from "@/lib/themes";

const PALETTE_STORAGE_KEY = "poker-planner-palette";

export function ModeToggle() {
  const [palette, setPalette] = React.useState("caffeine");

  React.useEffect(() => {
    const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY);
    const initialPalette =
      PALETTE_THEMES.find(({ name }) => name === savedPalette)?.name ??
      "caffeine";

    document.documentElement.classList.remove(
      ...PALETTE_THEMES.map(({ name }) => name),
    );
    document.documentElement.classList.add(initialPalette);
    setPalette(initialPalette);
  }, []);

  const selectPalette = (name: string) => {
    document.documentElement.classList.remove(
      ...PALETTE_THEMES.map(({ name }) => name),
    );
    document.documentElement.classList.add(name);
    localStorage.setItem(PALETTE_STORAGE_KEY, name);
    setPalette(name);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="animate-in fade-in slide-in-from-top-32 duration-700 ease-spring"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select color palette</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Color palette</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={selectPalette}
        >
          {PALETTE_THEMES.map(({ name, label }) => (
            <DropdownMenuRadioItem key={name} value={name}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
