"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

// Base UI requires `value` (number | null); `null` is indeterminate. The old
// Radix wrapper allowed omitting `value` (also indeterminate), so optional is
// kept here and coalesced to `null` to preserve that behavior.
type ProgressProps = Omit<
  React.ComponentProps<typeof ProgressPrimitive.Root>,
  "value"
> & {
  value?: number | null;
};

function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value ?? null}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="h-full w-full"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full w-full flex-1 bg-primary transition-all"
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
