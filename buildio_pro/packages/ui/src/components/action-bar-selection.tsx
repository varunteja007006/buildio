"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { type DivProps } from "@workspace/ui/components/action-bar-context";
import { cn } from "@workspace/ui/lib/utils";

function ActionBarSelection(props: DivProps) {
  const { className, asChild, children, ...selectionProps } = props;

  const render =
    asChild && React.isValidElement(children) ? children : undefined;

  return useRender({
    defaultTagName: "div",
    render,
    props: {
      "data-slot": "action-bar-selection",
      ...selectionProps,
      className: cn(
        "flex items-center gap-1 rounded-sm border px-2 py-1 font-medium text-sm tabular-nums",
        className,
      ),
      ...(render ? {} : { children }),
    },
  });
}

export { ActionBarSelection };
