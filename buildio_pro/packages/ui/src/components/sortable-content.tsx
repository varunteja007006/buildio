"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  SortableContext,
  type SortableContextProps,
} from "@dnd-kit/sortable";
import * as React from "react";

import {
  CONTENT_NAME,
  SortableContentContext,
  useSortableContext,
} from "@workspace/ui/components/sortable-context";

interface SortableContentProps extends React.ComponentProps<"div"> {
  strategy?: SortableContextProps["strategy"];
  children: React.ReactNode;
  /** @deprecated Radix compat — Base UI uses `render`. */
  asChild?: boolean;
  withoutSlot?: boolean;
}

function SortableContent(props: SortableContentProps) {
  const {
    strategy: strategyProp,
    asChild,
    withoutSlot,
    children,
    ref,
    ...contentProps
  } = props;

  const context = useSortableContext(CONTENT_NAME);

  const isSlot = asChild && React.isValidElement(children);

  const element = useRender({
    render: isSlot ? children : <div data-slot="sortable-content" />,
    ref,
    props: {
      "data-slot": "sortable-content",
      ...contentProps,
      ...(isSlot ? {} : { children }),
    },
  });

  return (
    <SortableContentContext.Provider value={true}>
      <SortableContext
        items={context.items}
        strategy={strategyProp ?? context.strategy}
      >
        {withoutSlot ? children : element}
      </SortableContext>
    </SortableContentContext.Provider>
  );
}

export { SortableContent };
