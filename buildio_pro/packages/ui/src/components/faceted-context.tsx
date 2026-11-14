"use client";

import * as React from "react";

import type { Popover } from "@workspace/ui/components/popover";

export type FacetedValue<Multiple extends boolean> =
  Multiple extends true ? string[] : string;

interface FacetedContextValue<Multiple extends boolean = boolean> {
  value?: FacetedValue<Multiple>;
  onItemSelect?: (value: string) => void;
  multiple?: Multiple;
}

const FacetedContext = React.createContext<FacetedContextValue<boolean> | null>(
  null,
);

function useFacetedContext(name: string) {
  const context = React.useContext(FacetedContext);
  if (!context) {
    throw new Error(`\`${name}\` must be within Faceted`);
  }
  return context;
}

export type PopoverChangeEventDetails = NonNullable<
  React.ComponentProps<typeof Popover>["onOpenChange"]
> extends (open: boolean, details: infer Details) => void
  ? Details
  : never;

/**
 * Mirrors Base UI's own imperative-close details (reason: "imperative-action")
 * for programmatic closes where no real event exists.
 */
export const programmaticCloseDetails: PopoverChangeEventDetails = {
  reason: "imperative-action",
  event: new Event("imperative-action"),
  cancel: () => {},
  allowPropagation: () => {},
  isCanceled: false,
  isPropagationAllowed: true,
  trigger: undefined,
  preventUnmountOnClose: () => {},
};

export { FacetedContext, useFacetedContext };
export type { FacetedContextValue };
