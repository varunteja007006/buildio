"use client";

import { Switch as UiSwitch } from "@workspace/ui/components/switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function CortexSwitch({
  className,
  ...props
}: React.ComponentProps<typeof UiSwitch>) {
  return (
    <UiSwitch
      className={cn(
        "data-checked:bg-accent data-checked:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export { CortexSwitch };
